.. _Model-Hardware:

Hardware
========

This represents physical hardware in a device

.. image:: Model-Hardware.png

Attributes
----------


* name:string - Name of the hardware

* ename:string - Extended Name of the hardware

* type:string - Type of the Hardware


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

    * - device
      - 1
      - Device
      - false
      - false
      - 

    * - resources
      - n
      - Resource
      - false
      - false
      - 



Methods
-------



    

