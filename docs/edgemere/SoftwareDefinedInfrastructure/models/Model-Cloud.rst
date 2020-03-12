.. _Model-Cloud:

Cloud
=====

This represents a cloud in the ecosystem. This can be public or private onprem or offprem

.. image:: Model-Cloud.png

Attributes
----------


* name:string - Name of the cloud

* ename:string - Extended name of the cloud. This gives the full path to the cloud in the system


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

    * - resources
      - n
      - Resource
      - false
      - true
      - 

    * - devices
      - n
      - Device
      - false
      - false
      - 

    * - adevices
      - n
      - AggregatedDevice
      - false
      - false
      - 

    * - datacenters
      - n
      - DataCenter
      - false
      - false
      - 

    * - reservations
      - n
      - Reservation
      - false
      - true
      - 

    * - requests
      - n
      - Request
      - false
      - true
      - 



Methods
-------



    

