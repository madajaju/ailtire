/**
 * model.js
 *
 * @description :: a model definition template
 */

module.exports = {
    name: 'string',
    description: 'string',
    extends: 'class,class2,...', // list of classes that get extended can be not defined.
    attributes: {
        name: {
            type: 'string|number|boolean|other',
            default: '',
            required: true | false,
            allownull: true | false,
            unique: true | false,
            embedded: true | false,
            // ...
        }
    },
    associations: {
        name: {
            type: 'model',
            unique: true | false, // if unique then store it as a map by default.
            cardinality: 'range', // [0-9]*\s*(\.\.\s*[0-9]*|n)? --- defaults to n,
            composition: true | false,
            owner: true | false,
            via: 'nameoftheotherside', // this implies navigability meaning i can go backwards
        }
    },
    methods: { // this should be a file for each method for the class. javascript machine.
        name: {
            parameters: {
                name: {
                    type: 'string|number|boolean|other',
                    description: 'description',
                    required: true | false
                }
            },
            function: function (opts) {
            },
            description: "documentation for the function"
        }
    },
    statenet: {
        statename: {
            actions: {
                before: {
                    functionname: function (param) {
                    },
                    functionname2: function (param) {
                    },
                },
                after: {
                    functionname3: function (param) {
                    },
                    functionname4: function (param) {
                    }
                }
            },
            events: { // Events to capture to move to the next state
                eventName1: {
                    statename: { // Next state if condition is met.
                        condition: function (param) {
                            return true;
                        },
                        action: function (param) {
                            return this;
                        },
                    }
                },
                eventName2: {
                    condition: function (param) { return true; },
                    action: function (param) { return this; },
                    destination: statename,
                }
            }
        },
        statename2: {
            beforeActions: {
                functionname: function (param) {
                },
                functionname2: function (param) {
                },
            },
            afterActions: {
                functionname3: function (param) {
                },
                functionname4: function (param) {
                },
            },
            transitions: {
                eventName1: {
                    condition: function (param) { return true; },
                    action: function (param) { return this; },
                    destination: statename,
                },
                eventName2: {
                    condition: function (param) { return true; },
                    action: function (param) { return this; },
                    destination: statename,
                }
            }
        }
    }

};

