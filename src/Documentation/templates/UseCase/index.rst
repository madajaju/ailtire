.. _UseCase-<%= usecase.name %>:

<%= usecase.name %>
<%= "=".repeat(usecase.name.length) %>

<%= usecase.description %>

.. image:: Activities.png

Actors
------

<% for(let aname in usecase.actors) {
let actorNoSpaces = aname.replace(/ /g, '');
-%>
* :ref:`Actor-<%= actorNoSpaces %>`
<% } %>

Detail Scenarios
----------------

<% for(let sname in usecase.scenarios) {
let nameNoSpaces = sname.replace(/ /g, '');
-%>
* :ref:`Scenario-<%= nameNoSpaces %>`
<% } %>
