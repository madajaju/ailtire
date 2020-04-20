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
<%- partial("./src/Documentation/templates/Action/_index.rst", {action: method}) %>
<% } %>

