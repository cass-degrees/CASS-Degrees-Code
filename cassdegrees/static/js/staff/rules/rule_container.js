// Contains a set of rules, with a button to add more
Vue.component('rule_container', {
    props: {
        "rules": {
            type: Array
        },
        // Message inserted between rules
        "separator": {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            show_add_a_rule_modal: false,
            add_a_rule_modal_option: 'course_list',

            component_groups: {'rules': COMPONENT_NAMES, 'requisites': REQUISITE_COMPONENT_NAMES},
            component_names: null,

            // Forces the element to re-render, if mutable events occurred
            redraw: false,
        }
    },
    methods: {
        add_rule() {
            this.show_add_a_rule_modal = false;
            this.rules.push({
                type: this.add_a_rule_modal_option,
            });
        },
        remove(index) {
            this.rules.splice(index, 1);
        },
        duplicate_rule(index) {
            // JSON.parse(JSON.stringify(...)) is done to actually duplicate the contents of the rule, rather than just copying the memory references.
            this.rules.push(JSON.parse(JSON.stringify(this.rules[index])));
        },
        check_options() {
            let valid = true;
            for (const index in this.$children) {
                valid = valid && this.$children[index].check_options();
            }

            return valid;
        },
        count_units: function() {
            const units = {"exact": 0, "max": 0, "min": 0};
            for (const child of this.$children) {
                const child_units = child.count_units();
                for (const key in child_units) {
                    units[key] += child_units[key];
                }
            }
            return units;
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#ruleContainerTemplate'
});
