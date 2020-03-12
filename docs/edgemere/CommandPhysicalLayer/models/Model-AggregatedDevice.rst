.. _Model-AggregatedDevice:

AggregatedDevice
================

This is a construct that has other devices under it

.. image:: Model-AggregatedDevice.png

Attributes
----------


* name:string - Name of the aggregated device

* ename:string - Extended name of the aggregated device


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
      - true
      - 

    * - devices
      - n
      - Device
      - false
      - true
      - 

    * - adevices
      - n
      - AggregatedDevice
      - false
      - true
      - 

    * - datacenter
      - 1
      - DataCenter
      - false
      - false
      - 



Methods
-------



    

