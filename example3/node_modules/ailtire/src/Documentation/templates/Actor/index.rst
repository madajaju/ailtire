.. _Actor-<%= actor.name.replace(/ /g, '') %>:

<%= actor.name %>
<%= "=".repeat(actor.name.length) %>

Use Cases
---------

<% for(let uname in actor.usecases) {
-%>
* :ref:`UseCase-<%= uname %>`
<% } %>
.. image:: UseCases.png

User Interface
--------------

TBD

Command Line Interface
----------------------

TBD
