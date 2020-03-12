.. _Model-DataInstance:

DataInstance
============

This is an instance of the data

.. image:: Model-DataInstance.png

Attributes
----------


* name:string - 


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

    * - data
      - 1
      - Data
      - false
      - 
      - 

    * - reference
      - 1
      - DataReference
      - false
      - 
      - 

    * - service
      - 1
      - ServiceInstance
      - false
      - 
      - 

    * - source
      - n
      - SourceMetaData
      - false
      - 
      - 

    * - metadata
      - n
      - MetaData
      - true
      - 
      - 

    * - lineage
      - n
      - LineageMetaData
      - true
      - 
      - 



Methods
-------



    

