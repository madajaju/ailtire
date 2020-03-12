
.. _Package-DataManagementLayer:

Data Management Layer
=====================

This layer is responsible for the management of data

Use Cases
---------

* :ref:`UseCase-ManageDataGovernance`
* :ref:`UseCase-ManageDataPolicies`
* :ref:`UseCase-ManageDataSources`
* :ref:`UseCase-ManageDataStrategy`


.. image:: UseCases.png

Users
-----
* :ref:`Actor-ChiefDataOfficer`
* :ref:`Actor-DataEngineer`


.. image:: UserInteraction.png

Interface
---------

* :ref:`Action-_diml_dml_data_govern(...)
* :ref:`Action-_diml_dml_data_policies(...)
* :ref:`Action-_diml_dml_data_sources(...)


Logical Artifacts
-----------------
The Data Model for the  Data Management Layer shows how the different objects and classes of object interact
and their structure.

* :ref:`Model-Data`
* :ref:`Model-DataAdaptor`
* :ref:`Model-DataBluePrint`
* :ref:`Model-DataInstance`
* :ref:`Model-DataReference`
* :ref:`Model-DataSource`
* :ref:`Model-LineageMetaData`
* :ref:`Model-MetaData`
* :ref:`Model-SourceMetaData`


.. image:: Logical.png


Activities and Flows
--------------------

The Data Management Layer subsystem provides the following activities and flows.

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

The Data Management Layer subsystem is is physically laid out on a hybrid cloud infrastructure. Each microservice is shown
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

.. _Action-/diml/dml/data/govern

/diml/dml/data/govern
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
        


.. _Action-/diml/dml/data/policies

/diml/dml/data/policies
~~~~~~~~~~~~~~~~~~~~~~~

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
        


.. _Action-/diml/dml/data/sources

/diml/dml/data/sources
~~~~~~~~~~~~~~~~~~~~~~

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
        



