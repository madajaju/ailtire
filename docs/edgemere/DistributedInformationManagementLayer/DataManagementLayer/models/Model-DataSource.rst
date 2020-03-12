.. _Model-DataSource:

DataSource
==========

Represents a physical data source that could be a database, filesystem, block storage

.. image:: Model-DataSource.png

Attributes
----------


* name:string - 

* type:string - 


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

    * - resource
      - 1
      - Resource
      - false
      - false
      - 

    * - data
      - n
      - Data
      - true
      - true
      - 



Methods
-------



    

