def behavior(state, context):
    """Gets and sets a boolean fixed-size-array using index notation"""
    state["b1_is_list"] = type(state["b1"]) is list
    state["b1_0_is_boolean"] = type(state["b1"][0]) is bool

    state["b2"] = [not state["b1"][0], not state["b1"][1]]

    state["b2_is_list"] = type(state["b1"]) is list
    state["b2_0_is_boolean"] = type(state["b2"][0]) is bool
