.. _Model-Reservation:

Reservation
===========

A reservation fullfils the request to the system for resources. When a request for a resource is made from a cloud. A reservation for the resource request is created for each device or devices that can satistfy the request. When the request is fulfilled the reservations are then no longer needed.

.. image:: Model-Reservation.png

Attributes
----------


* cost:number - This is the cost of the reservation


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

    * - device
      - 1
      - Device
      - false
      - false
      - 

    * - request
      - 1
      - Request
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


* :ref:`Action-Reservation-confirm`() - Confirm the Reservation
    
* :ref:`Action-Reservation-free`() - Description of the method
    

    
.. _Action-confirm

confirm
~~~~~~~

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

Confirm the Reservation

.. list-table:: Inputs
   :widths: 15 15 15 55
   :header-rows: 1

   * - Name
     - Type
     - Required
     - Description
        



.. _Action-free

free
~~~~

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
        




