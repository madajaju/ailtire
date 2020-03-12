.. _Model-Device:

Device
======

Representation of a device in a datacenter

.. image:: Model-Device.png

Attributes
----------


* name:string - Name of the device

* ename:string - Extended Name of the device

* type:string - Type of the Device


Associations
------------

.. list-table:: Associations
   :widths: 15 15 15 15 15 40
   :header-rows: 1

   * - Name
     - Cardinality
     - Class
     - Composition
     - Owner
     - Description

    * - profile
      - 1
      - PhysicalProfile
      - true
      - 
      - 

    * - hardware
      - n
      - Hardware
      - false
      - true
      - 

    * - datacenter
      - 1
      - DataCenter
      - false
      - false
      - 

    * - parent
      - 1
      - AggregatedDevice
      - false
      - false
      - 



Methods
-------


* :ref:`Action-Device-create`() - Create a Device
    
* :ref:`Action-Device-getReservations`() - Description of the method
    

    
.. _Action-create

create
~~~~~~

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

Create a Device

.. list-table:: Inputs
   :widths: 15 15 15 55
   :header-rows: 1

   * - Name
     - Type
     - Required
     - Description
        
    * - file
      - YAML
      - false
      - file with the definition
        



.. _Action-getReservations

getReservations
~~~~~~~~~~~~~~~

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

Description of the method

.. list-table:: Inputs
   :widths: 15 15 15 55
   :header-rows: 1

   * - Name
     - Type
     - Required
     - Description
        
    * - attr1
      - string
      - false
      - Description for the parameter
        




