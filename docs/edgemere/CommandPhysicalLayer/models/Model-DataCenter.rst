.. _Model-DataCenter:

DataCenter
==========

This represent the physical data center and contains several devices

.. image:: Model-DataCenter.png

Attributes
----------


* name:string - Name of the Datacenter


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



Methods
-------


* :ref:`Action-DataCenter-getReservations`() - Description of the method
    

    
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
        




