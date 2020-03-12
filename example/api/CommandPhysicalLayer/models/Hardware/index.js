
class Hardware {
    static definition = {
        name: 'Hardware',
        description: 'This represents physical hardware in a device',
        attributes: {
            name: {
                type: 'string',
                description: 'Name of the hardware'
            },
            ename: {
                type: 'string',
                description: 'Extended Name of the hardware'
            },
            type: {
                type: 'string',
                description: 'Type of the Hardware'
            }
        },
        associations: {
            profile: {
                type: 'PhysicalProfile',
                cardinality: 1,
                composition: true,
            },
            device: {
                type: 'Device',
                cardinality: 1,
                composition: false,
                owner: false,
            },
            resources: {
                type: 'Resource',
                cardinality: 'n',
                composition: false,
                owner: false,
            },
        },
        statenet: {
            Init: {
                events: {
                  create: {
                      Enabled: {}
                  }
                }
            },
            Enabled: {
                events: {
                    disable: {
                        Disabled: {}
                    }
                }
            },
            Disabled: {
                events: {
                    enable: {
                        Enabled: {}
                    }
                }
            }
        }
    }
}

module.exports = Hardware;

