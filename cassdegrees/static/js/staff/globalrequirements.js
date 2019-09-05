//! Basic utilities to handle serialization and deserialization of custom types (global requirements, rules)
//! which don't fit neatly into the regular HTML form list syntax.

// Terminology:
// (Global requirement) container: The entire fieldset + container for a singular global requirement.
// (Global requirement) inner container: Dynamic field inside a container containing options depending
//                                       on what rule type was selected.

// Handler for different Vue components, redirecting to the right component
var min_max = {
    props: {
        "details": {
            type: Object,

            validator: function (value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("unit_count")) {
                    value.unit_count = 0;
                }
                if (!value.hasOwnProperty("courses1000Level")) {
                    value.courses1000Level = false;
                }
                if (!value.hasOwnProperty("courses2000Level")) {
                    value.courses2000Level = false;
                }
                if (!value.hasOwnProperty("courses3000Level")) {
                    value.courses3000Level = false;
                }
                if (!value.hasOwnProperty("courses4000Level")) {
                    value.courses4000Level = false;
                }
                if (!value.hasOwnProperty("courses5000Level")) {
                    value.courses5000Level = false;
                }
                if (!value.hasOwnProperty("courses6000Level")) {
                    value.courses6000Level = false;
                }
                if (!value.hasOwnProperty("courses7000Level")) {
                    value.courses7000Level = false;
                }
                if (!value.hasOwnProperty("courses8000Level")) {
                    value.courses8000Level = false;
                }
                if (!value.hasOwnProperty("courses9000Level")) {
                    value.courses9000Level = false;
                }

                return true;
            }
        }
    },
    data: function() {
        return {
            "invalid_units": false,
            "invalid_units_step": false
        }
    },
    created: function() {
        this.check_options();
    },
    methods: {
        check_options: function() {
            this.invalid_units = this.details.unit_count <= 0;
            this.invalid_units_step = this.details.unit_count % 6 !== 0;
        }
    },
    template: '#minMaxUnitsTemplate'
};

Vue.component('global_requirement_min', min_max);
Vue.component('global_requirement_max', min_max);

Vue.component('global_requirement', {
    props: {
        "details": {
            type: Object
        }
    },
    data: function() {
        return {
            component_names: GLOBAL_REQUIREMENT_NAMES,
            component_help: GLOBAL_REQUIREMENT_HELP,
            show_help: false
        }
    },
    template: '#globalRequirementTemplate'
});

// Contains a set of rules, with a button to add more
Vue.component('global_requirement_container', {
    props: {
        "global_requirements": {
            type: Array
        },
        // Message inserted between rules
        "separator": {
            type: String,
            default: ""
        }
    },
    data: function() {
        return {
            show_add_a_global_requirement_modal: false,
            add_a_global_requirement_modal_option: 'min',

            component_names: GLOBAL_REQUIREMENT_NAMES,

            // Forces the element to re-render, if mutable events occurred
            redraw: false
        }
    },
    methods: {
        add_global_requirement: function() {
            this.show_add_a_global_requirement_modal = false;
            this.global_requirements.push({
                type: this.add_a_global_requirement_modal_option,
            });
            this.do_redraw();
        },
        remove: function(index) {
            this.global_requirements.splice(index, 1);
            this.do_redraw();
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw: function() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#globalRequirementContainerTemplate'
});

/**
 * Submits the program form.
 */
function handleProgram() {
    // Serialize list structures - this doesn't translate well over POST requests normally.
    document.getElementById("globalRequirements").value = JSON.stringify(globalRequirementsApp.global_requirements);

    return true;
}

// Translation table between internal names for components and human readable ones.
const GLOBAL_REQUIREMENT_NAMES = {
    'min': "Minimum Units from Year(s)",
    'max': "Maximum Units from Year(s)",
};

const GLOBAL_REQUIREMENT_HELP = {
    'min': "Enforces for an entire degree that a minimum amount of units *must* come from a particular " +
           "set of course levels - e.g. a minimum of 6 units of 1000-level courses over an entire program, " +
           "and 12 from 2000-level. Multiple of these global requirements may exist (e.g. if different unit counts " +
           "are needed).",
    'max': "Enforces for an entire degree that a maximum amount of units from a particular set of course levels " +
           "will exist - e.g. a maximum of 6 units of 1000-level courses over an entire program, and 12 from " +
           "2000-level. Multiple of these global requirements may exist (e.g. if different unit counts are needed).",
};

var globalRequirementsApp = new Vue({
    el: '#globalRequirementsContainer',
    data: {
        global_requirements: []
    }
});

var reqs = document.getElementById("globalRequirements").value.trim();
if (reqs.length > 0) {
    var parsed = JSON.parse(reqs);
    if (parsed != null) {
        globalRequirementsApp.global_requirements = parsed;
    }
}
