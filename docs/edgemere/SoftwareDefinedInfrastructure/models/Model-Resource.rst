.. _Model-Resource:

Resource
========

Resource in the cloud. Can be network, storage or compute.

.. image:: Model-Resource.png

Attributes
----------


* name:string - Name of the resource

* ename:string - Extended name of the resource

* disabled:boolean - Disabled Resource

* type:string - Type of resource, Network, Storage, Compute or Accelerator


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

    * - capabilities
      - n
      - Attribute
      - true
      - true
      - 

    * - available
      - n
      - Attribute
      - true
      - true
      - 

    * - metrics
      - n
      - Attribute
      - true
      - true
      - 

    * - hardware
      - n
      - Hardware
      - false
      - false
      - 

    * - instances
      - n
      - ServiceInstance
      - false
      - false
      - 

    * - cloud
      - 1
      - Cloud
      - false
      - false
      - 



Methods
-------



    

