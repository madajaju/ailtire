.. _Action-<%= action.name.replace(/-/g, '_') %>

<%= action.name %>
<%= "~".repeat(action.name.length) %>

* REST - action.name
* bin - action.name.replace(/\//g, ' ');
* js - action.name.replace(/\//g, '.');

<%= action.description %>

.. list-table:: Inputs
   :widths: 15 15 15 55
   :header-rows: 1

   * - Name
     - Type
     - Required
     - Description
        <% for(let iname in action.inputs)  {
            let input = action.inputs[iname];
        %>
    * - <%= iname %>
      - <%= input.type%>
      - <%= input.required %>
      - <%= input.description %>
        <% } %>

