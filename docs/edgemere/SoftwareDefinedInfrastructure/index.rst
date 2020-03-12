
.. _Package-SoftwareDefinedInfrastructure:

Software Defined Infrastructure
===============================

Software Defined Infrastructure is a package that contains...

Use Cases
---------

* :ref:`UseCase-ManageResources`


.. image:: UseCases.png

Users
-----
* :ref:`Actor-ITOps`


.. image:: UserInteraction.png

Interface
---------

* :ref:`Action-_sdi_getresources(...)
* :ref:`Action-_sdi_releaseresources(...)
* :ref:`Action-_sdi_sdi_getresources(...)


Logical Artifacts
-----------------
The Data Model for the  Software Defined Infrastructure shows how the different objects and classes of object interact
and their structure.

* :ref:`Model-Cloud`
* :ref:`Model-Request`
* :ref:`Model-Reservation`
* :ref:`Model-Resource`


.. image:: Logical.png


Activities and Flows
--------------------

The Software Defined Infrastructure subsystem provides the following activities and flows.

.. image::  Process.png

Deployment Architecture
-----------------------

This subsystem is deployed using micro-services as shown in the diagram below. The 'micro' module is
used to implement the micro-services in the system.
The subsystem also has an CLI, REST and Web Interface exposed through a sailajs application. The sailsjs
application will interface with the micro-services and can monitor and drive work-flows through the mesh of
micro-services.

.. image:: Deployment.png

Physical Architecture
---------------------

The Software Defined Infrastructure subsystem is is physically laid out on a hybrid cloud infrastructure. Each microservice is shown
how they connect to each other. All of the micro-services communicate to each other and the main app through a
REST interface. A CLI, REST or Web interface for the app is how other subsystems or actors interact. Requests are
forwarded to micro-services through the REST interface of each micro-service.

.. image:: Physical.png

Micro-Services
--------------

These are the micro-services for the subsystem. The combination of the micro-services help implement
the subsystem's logic.

* :ref:`Service-service-name`

Interface Details
-----------------

.. _Action-/sdi/getresources

/sdi/getresources
~~~~~~~~~~~~~~~~~

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

Get Resources from the SDI Layer

.. list-table:: Inputs
   :widths: 15 15 15 55
   :header-rows: 1

   * - Name
     - Type
     - Required
     - Description
        
    * - cloud
      - string
      - true
      - Cloud to request the Resources
        
    * - name
      - string
      - true
      - The name of the Resource to create.
        
    * - requirement
      - json
      - true
      - The Requirements to create the resource
        


.. _Action-/sdi/releaseresources

/sdi/releaseresources
~~~~~~~~~~~~~~~~~~~~~

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

Release Resources from the SDI Layer with the given name

.. list-table:: Inputs
   :widths: 15 15 15 55
   :header-rows: 1

   * - Name
     - Type
     - Required
     - Description
        
    * - cloud
      - string
      - true
      - Cloud to request the Resources
        
    * - name
      - string
      - true
      - The name of the Resource to create.
        


.. _Action-/sdi/sdi/getresources

/sdi/sdi/getresources
~~~~~~~~~~~~~~~~~~~~~

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

Description of the action

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
        



