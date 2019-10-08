// Handler for different Vue components, redirecting to the right component
// Also has a visual container with help buttons/etc
Vue.component('rule', {
    props: {
        "details": {
            type: Object
        }
    },
    data() {
        return {
            component_names: ALL_COMPONENT_NAMES,
            component_help: ALL_COMPONENT_HELP,
            show_help: false,
            refresh: [],
        }
    },
    mounted() {
        if (should_mark_newest_component) {
            const siblings = app.$children[0].$children;

            // Determine whether this rule is the most recent rule by finding which sibling
            // has the highest _uid assigned by Vue.
            let max = 0;
            const rule_creation_ranks = {};
            siblings.forEach(function (sib) {
                if (!sib.$children[0].is_eitheror) {
                    rule_creation_ranks[sib._uid] = sib;
                    sib.$el.classList.remove("rule_active_visual");
                    max = (sib._uid > max) ? sib._uid : max;
                }
                // Else we need to get the children of the either or rule
                else {
                    // If nested or rules get implemented, this section may need to be made recursive
                    const either_or_rules = sib.$children[0].$children;
                    sib.$el.classList.remove("rule_active_visual");

                    if (either_or_rules.length > 0) {
                        either_or_rules.forEach(function (rule) {
                            rule_creation_ranks[rule._uid] = rule;
                            rule.$el.classList.remove("rule_active_visual");
                            max = (rule._uid > max) ? rule._uid : max;
                        })
                    } else {
                        rule_creation_ranks[sib._uid] = sib;
                        max = (sib._uid > max) ? sib._uid : max;
                    }
                }
            });
            const recent_rule = rule_creation_ranks[max];

            // Add a visual cue and scroll to the most recent rule
            recent_rule.$el.classList.add("rule_active_visual");
            recent_rule.$el.scrollIntoView({behavior: "smooth"})
        }
    },
    methods: {
        check_options(is_submission) {
            let valid = true;
            for (const index in this.$children) {
                valid = valid && this.$children[index].check_options(is_submission);
            }

            return valid;
        },

        count_units() {
            return this.$children[0].count_units();
        },

        get_or_rule_update_units_fn() {
            // Looks through the parent nodes until it finds the OR rule, returning its "count_units" function
            // If no OR rule is found, an empty function is returned
            let parent_or = this.$parent;
            while (parent_or !== undefined) {
                if (parent_or.constructor.options.name === 'rule_either_or') {
                    return parent_or.update_units;
                }
                parent_or = parent_or.$parent;
            }
            return () => {
            };
        }
    },
    template: '#ruleTemplate'
});
