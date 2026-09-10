module.exports = {
    name: 'ComprehensiveLectureWorkflow',
    version: '1.0.0',
    description: 'Reference workflow showing dependencies, events, guards, lifecycle, human approval, and conditional paths.',

    inputs: {
        directory: {type: 'string', required: true, description: 'Directory containing the source lecture.'},
        podcastId: {type: 'string', required: true},
        contributor: {type: 'string', required: true},
        publish: {type: 'boolean', required: false, description: 'Whether the final asset may be published.', default: false}
    },

    outputs: {
        episodeId: {type: 'string'},
        published: {type: 'boolean'},
        skipped: {type: 'boolean'}
    },

    eventTypes: {
        'lecture.file.changed': {payload: {path: 'string', eventType: 'string'}},
        'lecture.source.ready': {payload: {video: 'string', transcript: 'string'}},
        'lecture.analysis.completed': {payload: {title: 'string', episodeJson: 'string'}},
        'lecture.review.approved': {payload: {reviewer: 'string'}},
        'lecture.review.rejected': {payload: {reason: 'string'}},
        'lecture.assets.ready': {payload: {episodeId: 'string'}},
        'lecture.published': {payload: {episodeId: 'string'}}
    },

    activities: {
        watchDirectory: {
            type: 'event-generator',
            ref: 'AFileSystemWatcher/start',
            inputs: {directory: '$inputs.directory', correlationId: '$inputs.correlationId'},
            emits: ['lecture.file.changed'],
            lifecycle: {
                mode: 'persistent',
                stopWhen: {events: ['lecture.published']}
            }
        },

        downloadSource: {
            type: 'activity',
            ref: 'lecture/downloadSource',
            triggers: [{events: ['lecture.file.changed'], guard: "payload.eventType === 'change'"}],
            inputs: {directory: '$inputs.directory', path: '$event.path'},
            outputs: {video: '$steps.downloadSource.outputs.video', transcript: '$steps.downloadSource.outputs.transcript'},
            emits: ['lecture.source.ready'],
            policy: {retryLimit: 3, timeoutMs: 600000}
        },

        analyze: {
            type: 'activity',
            ref: 'lecture/analyze',
            dependencies: ['downloadSource'],
            triggers: [{events: ['lecture.source.ready']}],
            inputs: {video: '$event.video', transcript: '$event.transcript'},
            outputs: {title: '$steps.analyze.outputs.title', episodeJson: '$steps.analyze.outputs.episodeJson'},
            emits: ['lecture.analysis.completed']
        },

        createEpisode: {
            type: 'activity',
            ref: 'lecture/createEpisode',
            dependencies: ['analyze'],
            triggers: [{events: ['lecture.analysis.completed']}],
            inputs: {podcastId: '$inputs.podcastId', contributor: '$inputs.contributor', episodeJson: '$event.episodeJson'},
            outputs: {episodeId: '$steps.createEpisode.outputs.episodeId'}
        },

        requestReview: {
            type: 'human',
            ref: 'lecture/review',
            dependencies: ['createEpisode'],
            triggers: [{events: ['lecture.analysis.completed']}],
            inputs: {title: '$event.title', episodeId: '$steps.createEpisode.outputs.episodeId'},
            humanRequest: {prompt: 'Review the title and episode metadata. Approve to continue or reject with a reason.'},
            emits: ['lecture.review.approved', 'lecture.review.rejected']
        },

        revise: {
            type: 'activity',
            ref: 'lecture/revise',
            triggers: [{events: ['lecture.review.rejected'], guard: "payload.reason && payload.reason.length > 0"}],
            inputs: {reason: '$event.reason', episodeId: '$steps.createEpisode.outputs.episodeId'},
            lifecycle: {mode: 'once'}
        },

        generateArtwork: {
            type: 'activity',
            ref: 'lecture/generateArtwork',
            dependencies: ['analyze'],
            triggers: [{events: ['lecture.analysis.completed']}],
            inputs: {title: '$event.title'},
            outputs: {thumbnail: '$steps.generateArtwork.outputs.thumbnail'}
        },

        prepareAssets: {
            type: 'activity',
            ref: 'lecture/prepareAssets',
            dependencies: ['createEpisode', 'generateArtwork', 'requestReview'],
            triggers: [{mode: 'and', events: ['lecture.review.approved']}],
            inputs: {episodeId: '$steps.createEpisode.outputs.episodeId', thumbnail: '$steps.generateArtwork.outputs.thumbnail'},
            emits: ['lecture.assets.ready']
        },

        publish: {
            type: 'activity',
            ref: 'lecture/publish',
            dependencies: ['prepareAssets'],
            triggers: [{events: ['lecture.assets.ready'], guard: 'context.publish === true'}],
            inputs: {episodeId: '$steps.createEpisode.outputs.episodeId'},
            outputs: {published: '$steps.publish.outputs.published'},
            emits: ['lecture.published']
        },

        markSkipped: {
            type: 'activity',
            ref: 'lecture/markSkipped',
            dependencies: ['prepareAssets'],
            triggers: [{events: ['lecture.assets.ready'], guard: 'context.publish !== true'}],
            outputs: {skipped: '$steps.markSkipped.outputs.skipped'}
        }
    },

    handlers: [
        {eventType: 'lecture.file.changed', action: 'lecture/downloadSource'},
        {eventType: 'lecture.source.ready', action: 'lecture/analyze'},
        {eventType: 'lecture.analysis.completed', action: 'lecture/createEpisode'},
        {eventType: 'lecture.analysis.completed', action: 'lecture/review'},
        {eventType: 'lecture.analysis.completed', action: 'lecture/generateArtwork'},
        {eventType: 'lecture.review.approved', action: 'lecture/prepareAssets'},
        {eventType: 'lecture.assets.ready', action: 'lecture/publish'}
    ]
};
