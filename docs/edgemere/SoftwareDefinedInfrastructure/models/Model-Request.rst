.. _Model-Request:

Request
=======

This represents a request being made for a resource in the cloud. This is only the request a set of reservations will be created for each request. When the request is satisfied the requestwill change state to Satisfied, and be returned to the requesterlong description

.. image:: Model-Request.png

Attributes
----------


* name:string - Name of the request being made

* ename:string - Extended Name of the request being made. It contains the lineage of the request in the name

* type:string - This is the type of resource being requested


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

    * - requirements
      - n
      - Attribute
      - true
      - true
      - 

    * - reservations
      - n
      - Reservation
      - false
      - true
      - 

    * - cloud
      - 1
      - Cloud
      - false
      - false
      - 

    * - parent
      - 1
      - LandscapeRequest
      - false
      - false
      - 



Methods
-------


* :ref:`Action-Request-confirm`() - Description of the method
    

    
.. _Action-confirm

confirm
~~~~~~~

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
        




