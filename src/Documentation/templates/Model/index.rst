.. _Model-<%- model.name %>:

<%- model.name %>
<%= "=".repeat(model.name.length) %>

<%= model.description %>

.. image:: Model-<%- model.name %>.png

Attributes
----------

<% for(let i in model.attributes) {
    let attribute = model.attributes[i];
%>
* <%= i %>:<%= attribute.type %> - <%= attribute.description %>
<% } %>

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
<% for(let aname in model.associations) {
    let assoc = model.associations[aname];
%>
    * - <%= aname %>
      - <%= assoc.cardinality %>
      - <%= assoc.type %>
      - <%= assoc.composition %>
      - <%= assoc.owner %>
      - <%= assoc.description %>
<% } %>

<% if(model.statenet) {
%>
State Net
---------
.. image:: Model-<%- model.name %>-StateNet.png

.. list-table:: States
   :widths: 15 15 70
   :header-rows: 1

   * - Name
     - Description
     - Events
<% for(let name in model.statenet) {
    let state = model.statenet[name];
    let eventNames = "";
%>
    * - <%= name %>
      - <%= state.description %>
    <% for(let stateName in state.events) {
        eventNames += stateName + '->' + state.events[stateName] + ', ';
     } %>
      - <%= eventNames %>
<% } %>
<% } %>

Methods
-------

<%
    for(let mname in model.methods) {
        let method = model.methods[mname];
%>
* :ref:`Action-<%= model.name %>-<%= mname %>`() - <%= method.description %>
    <% } %>

    <% for(let mname in model.methods) {
        let method = model.methods[mname];
        method.name = mname;
%>
<%- partial("./templates/Action/_index.rst", {action: method}) %>
<% } %>

