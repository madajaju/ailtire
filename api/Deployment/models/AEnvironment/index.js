
class AEnvironment {
    static definition = {
  "name": "AEnvironment",
  "attributes": {
    "name": {
      "type": "string",
      "description": "Logical name of the environment (e.g. \"local\", \"prod\")"
    },
    "description": {
      "type": "string",
      "description": "Human-readable description of this environment"
    },
    "color": {
      "type": "string",
      "description": "Visualization color for this environment (e.g. \"#aa44aa\")"
    }
  },
  "associations": {
    "locations": {
      "type": "ALocation",
      "description": "Physical or logical sites that belong to this environment",
      "composition": false,
      "owner": false
    },
    "networks": {
      "type": "ANetwork",
      "description": "Subnet or VLAN segments defined in this environment",
      "composition": false,
      "owner": false
    },
    "networkDevices": {
      "type": "ANetworkDevice",
      "description": "Switches, routers, firewalls, etc. present in this environment",
      "composition": false,
      "owner": false
    },
    "computeDevices": {
      "type": "AComputeDevice",
      "description": "VMs or bare-metal nodes in this environment",
      "composition": false,
      "owner": false
    },
    "storageVolumes": {
      "type": "AStorageDevice",
      "description": "Block or object storage resources in this environment",
      "composition": false,
      "owner": false
    }
  },
  "statenet": {}
}
}
module.exports = AEnvironment;