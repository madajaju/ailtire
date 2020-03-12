.. _Model-DataReference:

DataReference
=============

This reference is how Services access data through an abstract layer

.. image:: Model-DataReference.png

Attributes
----------


* name:string - 

* connection:string - 


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

    * - instances
      - n
      - DataInstance
      - true
      - false
      - 



Methods
-------


* :ref:`Action-DataReference-load`() - Create a Application in the System
    

    
.. _Action-load

load
~~~~

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

Create a Application in the System

.. list-table:: Inputs
   :widths: 15 15 15 55
   :header-rows: 1

   * - Name
     - Type
     - Required
     - Description
        
    * - scope
      - string
      - true
      - The scope of the Data Reference
        
    * - data
      - ref
      - true
      - The information for the Data Reference
        




