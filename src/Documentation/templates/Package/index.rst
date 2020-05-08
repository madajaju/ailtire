<% let packageNoSpaces = package.name.replace(/ /g, ''); %>
.. _Package-<%= packageNoSpaces %>:

<%= package.name %>
<%= "=".repeat(package.name.length) %>

<%= package.description %>

Use Cases
---------

<% for(let uname in package.usecases) {
let uc = package.usecases[uname];
let ucNoSpace = uname.replace(/ /g, '');
-%>
* :ref:`UseCase-<%= ucNoSpace %>`
<% } %>

.. image:: UseCases.png

Users
-----
<% for(let aname in actors) {
let anameNoSpace = actors[aname].name.replace(/ /g, '');
-%>
* :ref:`Actor-<%= anameNoSpace %>`
<% } %>

.. image:: UserInteraction.png

Interface
---------

<% for(let mname in package.interface) {
let method = package.interface[mname]
-%>
* :ref:`Action-<%= mname.replace(/\//g, '_') %>(...)
<% } %>

Logical Artifacts
-----------------
The Data Model for the  <%- package.name %> shows how the different objects and classes of object interact
and their structure.

<% for(let cname in package.classes) {
    let cls = package.classes[cname].definition;
    let clsNoSpace = cls.name.replace(/ /g, '');
-%>
* :ref:`Model-<%= clsNoSpace %>`
<% } %>

.. image:: Logical.png


Activities and Flows
--------------------

The <%= package.name %> subsystem provides the following activities and flows.

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

The <%= package.name %> subsystem is is physically laid out on a hybrid cloud infrastructure. Each microservice is shown
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

<% for(let mname in package.interface) {
    let method = package.interface[mname]
    method.name = mname;
-%>
<%- partial("./templates/Action/_index.rst", {action: method}) %>
<% } %>
