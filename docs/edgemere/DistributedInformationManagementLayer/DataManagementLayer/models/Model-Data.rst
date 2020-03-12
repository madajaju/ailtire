.. _Model-Data:

Data
====

This class represents data that is stored in the system. It has a relaitonship with a StorageResourceas all data must have someplace to reside. The access attribute is a catch all for how to access the data. It could be a connection string to a data like a database, a filesystem etc.. Specializations of the DataReference class know what to do
with the access attribute.

.. image:: Model-Data.png

Attributes
----------


* access:string - A string that repesents how to access the data. This could be a database connection string, file system path,etc..


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

    * - source
      - 1
      - DataSource
      - false
      - false
      - 

    * - instances
      - n
      - DataInstance
      - 
      - false
      - 



Methods
-------



    

