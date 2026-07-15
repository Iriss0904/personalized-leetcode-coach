import type { PublicHot150Problem } from "@/data/hot150/local-run-types";
import type { CodeRunTestCase } from "@/types/code-runner";
import { PISTON_RESULT_MARKER } from "./normalize-run-result";

export function buildPythonLocalHot150Wrapper(args: {
  problem: PublicHot150Problem;
  testCases: CodeRunTestCase[];
  userCode: string;
}) {
  const contract = {
    signature: args.problem.signature,
    serialization: args.problem.serialization,
    comparison: args.problem.comparison,
  };

  return [
    "from __future__ import annotations",
    "from typing import *",
    "import collections as _pc_collections",
    "import contextlib as _pc_contextlib",
    "import copy as _pc_copy",
    "import io as _pc_io",
    "import json as _pc_json",
    "import math as _pc_math",
    "import traceback as _pc_traceback",
    "",
    helperTypes,
    "",
    `_PC_MARKER = ${JSON.stringify(PISTON_RESULT_MARKER)}`,
    `_PC_USER_CODE = ${JSON.stringify(args.userCode)}`,
    `_PC_CONTRACT = _pc_json.loads(${JSON.stringify(JSON.stringify(contract))})`,
    `_PC_TESTS = _pc_json.loads(${JSON.stringify(JSON.stringify(args.testCases))})`,
    "",
    runtimeHelpers,
    "",
    "_pc_main()",
  ].join("\n");
}

const helperTypes = String.raw`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Node:
    def __init__(self, val=0, *args):
        self.val = val
        self.neighbors = []
        self.left = None
        self.right = None
        self.next = None
        self.random = None
        self.isLeaf = False
        self.topLeft = None
        self.topRight = None
        self.bottomLeft = None
        self.bottomRight = None
        if len(args) == 1 and isinstance(args[0], list):
            self.neighbors = args[0]
        elif len(args) == 1 and isinstance(args[0], bool):
            self.isLeaf = args[0]
        elif len(args) == 3:
            self.left, self.right, self.next = args
        elif len(args) >= 5:
            self.isLeaf = bool(args[0])
            self.topLeft, self.topRight, self.bottomLeft, self.bottomRight = args[1:5]
`;

const runtimeHelpers = String.raw`
def _pc_emit(payload):
    print(_PC_MARKER + _pc_json.dumps(payload, ensure_ascii=False, separators=(',', ':')))

def _pc_list_to_linked(values):
    dummy = ListNode()
    tail = dummy
    for value in values or []:
        tail.next = ListNode(value)
        tail = tail.next
    return dummy.next

def _pc_linked_to_list(head):
    out, seen = [], set()
    while head is not None and id(head) not in seen:
        seen.add(id(head))
        out.append(head.val)
        head = head.next
    return out

def _pc_linked_with_cycle(values, pos):
    head = _pc_list_to_linked(values)
    nodes, cur = [], head
    while cur is not None:
        nodes.append(cur)
        cur = cur.next
    if nodes and isinstance(pos, int) and 0 <= pos < len(nodes):
        nodes[-1].next = nodes[pos]
    return head

def _pc_list_to_tree(values, node_type=TreeNode):
    if not values:
        return None
    nodes = [None if value is None else node_type(value) for value in values]
    child = 1
    for node in nodes:
        if node is None:
            continue
        if child < len(nodes):
            node.left = nodes[child]
            child += 1
        if child < len(nodes):
            node.right = nodes[child]
            child += 1
    return nodes[0]

def _pc_tree_to_list(root):
    if root is None:
        return []
    out = []
    queue = _pc_collections.deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        queue.extend([node.left, node.right])
    while out and out[-1] is None:
        out.pop()
    return out

def _pc_next_tree_to_list(root):
    if root is None:
        return []
    out, level = [], root
    while level:
        cur, next_level = level, None
        while cur:
            out.append(cur.val)
            next_level = next_level or getattr(cur, 'left', None) or getattr(cur, 'right', None)
            cur = getattr(cur, 'next', None)
        out.append('#')
        level = next_level
    return out

def _pc_random_list_from_pairs(values):
    if not values:
        return None
    nodes = [Node(pair[0]) for pair in values]
    for index, pair in enumerate(values):
        if index + 1 < len(nodes):
            nodes[index].next = nodes[index + 1]
        random_index = pair[1]
        nodes[index].random = nodes[random_index] if isinstance(random_index, int) else None
    return nodes[0]

def _pc_random_list_to_pairs(head):
    nodes, positions, cur = [], {}, head
    while cur is not None and id(cur) not in positions:
        positions[id(cur)] = len(nodes)
        nodes.append(cur)
        cur = cur.next
    return [[node.val, positions.get(id(node.random)) if node.random is not None else None] for node in nodes]

def _pc_graph_from_adjacency(adjacency):
    if not adjacency:
        return None
    nodes = [Node(index + 1) for index in range(len(adjacency))]
    for index, neighbors in enumerate(adjacency):
        nodes[index].neighbors = [nodes[value - 1] for value in neighbors]
    return nodes[0]

def _pc_graph_to_adjacency(node):
    if node is None:
        return []
    found, queue = {}, _pc_collections.deque([node])
    while queue:
        cur = queue.popleft()
        if cur.val in found:
            continue
        found[cur.val] = cur
        queue.extend(cur.neighbors or [])
    return [sorted(neighbor.val for neighbor in found[value].neighbors) for value in sorted(found)]

def _pc_quad_to_list(root):
    if root is None:
        return []
    out, queue = [], _pc_collections.deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            out.append(None)
            continue
        leaf = bool(getattr(node, 'isLeaf', False))
        out.append([1 if leaf else 0, 1 if bool(node.val) else 0])
        if not leaf:
            queue.extend([node.topLeft, node.topRight, node.bottomLeft, node.bottomRight])
    while out and out[-1] is None:
        out.pop()
    return out

def _pc_find_tree_node(root, value):
    queue = _pc_collections.deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            continue
        if node.val == value:
            return node
        queue.extend([node.left, node.right])
    return None

def _pc_adapt(adapter, raw, full_input, built_args):
    value = _pc_copy.deepcopy(raw)
    if adapter in ('identity', 'operation_arguments'):
        return value
    if adapter == 'linked_list':
        return _pc_list_to_linked(value)
    if adapter == 'linked_list_array':
        return [_pc_list_to_linked(item) for item in value or []]
    if adapter == 'linked_list_with_cycle':
        return _pc_linked_with_cycle(value, full_input.get('pos', -1))
    if adapter == 'binary_tree':
        return _pc_list_to_tree(value)
    if adapter == 'next_pointer_tree':
        return _pc_list_to_tree(value, Node)
    if adapter == 'binary_tree_node_reference':
        root = next((item for item in built_args if isinstance(item, TreeNode)), None)
        return _pc_find_tree_node(root, value)
    if adapter == 'random_pointer_list':
        return _pc_random_list_from_pairs(value)
    if adapter == 'graph_adjacency_list':
        return _pc_graph_from_adjacency(value)
    return value

def _pc_serialize(adapter, value):
    if adapter in ('identity', 'operation_results'):
        if isinstance(value, tuple):
            return [_pc_serialize('identity', item) for item in value]
        if isinstance(value, list):
            return [_pc_serialize('identity', item) for item in value]
        return value
    if adapter == 'linked_list':
        return _pc_linked_to_list(value)
    if adapter == 'binary_tree':
        return _pc_tree_to_list(value)
    if adapter == 'next_pointer_tree':
        return _pc_next_tree_to_list(value)
    if adapter == 'random_pointer_list':
        return _pc_random_list_to_pairs(value)
    if adapter == 'graph_adjacency_list':
        return _pc_graph_to_adjacency(value)
    if adapter == 'quad_tree':
        return _pc_quad_to_list(value)
    return value

def _pc_sort_key(value):
    return _pc_json.dumps(value, sort_keys=True, separators=(',', ':'))

def _pc_recursive_sort(value):
    if isinstance(value, list):
        return sorted((_pc_recursive_sort(item) for item in value), key=_pc_sort_key)
    if isinstance(value, dict):
        return {key: _pc_recursive_sort(value[key]) for key in sorted(value)}
    return value

def _pc_float_equal(actual, expected, epsilon):
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return _pc_math.isclose(float(actual), float(expected), rel_tol=epsilon, abs_tol=epsilon)
    if isinstance(actual, list) and isinstance(expected, list):
        return len(actual) == len(expected) and all(_pc_float_equal(a, e, epsilon) for a, e in zip(actual, expected))
    return actual == expected

def _pc_special_equal(actual, expected, test, config):
    if config.get('kind') == 'return_prefix_multiset':
        if not isinstance(actual, dict) or not isinstance(expected, dict):
            return False
        return actual.get('returnValue') == expected.get('returnValue') and _pc_recursive_sort(actual.get('mutatedPrefix', [])) == _pc_recursive_sort(expected.get('mutatedPrefix', []))
    if config.get('kind') == 'topological_order':
        count = test['input'].get(config.get('countParameter', 'numCourses'))
        edges = test['input'].get(config.get('edgesParameter', 'prerequisites'), [])
        if expected == []:
            return actual == []
        if not isinstance(actual, list) or sorted(actual) != list(range(count)):
            return False
        position = {value: index for index, value in enumerate(actual)}
        return all(position[before] < position[course] for course, before in edges)
    if config.get('kind') == 'peak_index':
        nums = test['input'].get(config.get('arrayParameter', 'nums'), [])
        return isinstance(actual, int) and 0 <= actual < len(nums) and (actual == 0 or nums[actual] > nums[actual - 1]) and (actual == len(nums) - 1 or nums[actual] > nums[actual + 1])
    return actual == expected

def _pc_equal(actual, expected, test):
    comparison = _PC_CONTRACT['comparison']
    strategy = comparison['strategy']
    config = comparison.get('config') or {}
    if strategy == 'unordered':
        return sorted(actual, key=_pc_sort_key) == sorted(expected, key=_pc_sort_key)
    if strategy == 'multiset':
        return _pc_recursive_sort(actual) == _pc_recursive_sort(expected)
    if strategy == 'float_tolerance':
        return _pc_float_equal(actual, expected, float(config.get('epsilon', 1e-6)))
    if strategy == 'operation_sequence':
        if not isinstance(actual, list) or len(actual) != len(expected):
            return False
        ignored = set(config.get('ignoreOperations', '').split(',')) if config.get('ignoreOperations') else set()
        operations = test['input'].get('operations', [])
        return all(expected_item is None or (operations[index] in ignored) or _pc_float_equal(actual_item, expected_item, float(config.get('epsilon', 1e-6))) for index, (actual_item, expected_item) in enumerate(zip(actual, expected)))
    if strategy == 'public_special_judge':
        return _pc_special_equal(actual, expected, test, config)
    return actual == expected

def _pc_design_argument(class_name, operation, index, value):
    operation_adapters = _PC_CONTRACT['serialization'].get('operationArgumentAdapters') or {}
    adapters = operation_adapters.get(operation, [])
    if index < len(adapters):
        return _pc_adapt(adapters[index], value, {}, [])
    return _pc_copy.deepcopy(value)

def _pc_run_design(test):
    input_value = test['input']
    operations = input_value.get('operations', [])
    arguments = input_value.get('arguments', [])
    class_name = _PC_CONTRACT['signature']['className']
    if not operations or operations[0] != class_name:
        raise ValueError('first operation must construct the declared design object')
    klass = globals().get(class_name)
    if klass is None:
        raise NameError(f'{class_name} is not defined')
    constructor_args = [_pc_design_argument(class_name, class_name, index, value) for index, value in enumerate(arguments[0])]
    instance = klass(*constructor_args)
    outputs = [None]
    for operation, values in zip(operations[1:], arguments[1:]):
        runtime_args = [_pc_design_argument(class_name, operation, index, value) for index, value in enumerate(values)]
        outputs.append(_pc_serialize('identity', getattr(instance, operation)(*runtime_args)))
    return outputs

def _pc_run_case(test):
    signature = _PC_CONTRACT['signature']
    serialization = _PC_CONTRACT['serialization']
    if signature['contractKind'] == 'design_object':
        return _pc_run_design(test)
    input_value = test['input']
    adapters = {entry['parameter']: entry['adapter'] for entry in serialization['parameterAdapters']}
    runtime_args = []
    for parameter in signature['parameters']:
        name = parameter['name']
        runtime_args.append(_pc_adapt(adapters[name], input_value.get(name), input_value, runtime_args))
    solution = Solution()
    result = getattr(solution, signature['methodName'])(*runtime_args)
    if signature['contractKind'] == 'return_and_mutated_prefix':
        index = serialization['mutatedArgumentIndex']
        mutated = runtime_args[index]
        if not isinstance(result, int) or result < 0:
            return {'returnValue': result, 'mutatedPrefix': []}
        return {'returnValue': result, 'mutatedPrefix': _pc_copy.deepcopy(mutated[:result])}
    if signature['contractKind'] == 'inplace_argument':
        result = runtime_args[serialization['mutatedArgumentIndex']]
        adapter = serialization['parameterAdapters'][serialization['mutatedArgumentIndex']]['adapter']
        return _pc_serialize('identity' if adapter == 'identity' else adapter, result)
    return _pc_serialize(serialization['returnAdapter'], result)

def _pc_main():
    try:
        exec(compile(_PC_USER_CODE, 'user_code.py', 'exec'), globals())
    except SyntaxError as error:
        _pc_emit({'status': 'syntax_error', 'testResults': [], 'error': f'{error.__class__.__name__}: {error}'})
        return
    except Exception as error:
        _pc_emit({'status': 'runtime_error', 'testResults': [], 'error': ''.join(_pc_traceback.format_exception_only(type(error), error)).strip()})
        return

    results = []
    for test in _PC_TESTS:
        stdout, stderr = _pc_io.StringIO(), _pc_io.StringIO()
        try:
            with _pc_contextlib.redirect_stdout(stdout), _pc_contextlib.redirect_stderr(stderr):
                actual = _pc_run_case(test)
            expected = test.get('expected')
            passed = _pc_equal(actual, expected, test)
            results.append({'id': test['id'], 'label': test['label'], 'input': None if passed else test['input'], 'expected': None if passed else expected, 'actual': None if passed else actual, 'passed': passed, 'stdout': stdout.getvalue().rstrip('\n'), 'stderr': stderr.getvalue().rstrip('\n')})
        except Exception as error:
            results.append({'id': test['id'], 'label': test['label'], 'input': test['input'], 'expected': test.get('expected'), 'actual': None, 'passed': False, 'error': ''.join(_pc_traceback.format_exception_only(type(error), error)).strip(), 'stdout': stdout.getvalue().rstrip('\n'), 'stderr': stderr.getvalue().rstrip('\n')})
            _pc_emit({'status': 'runtime_error', 'testResults': results, 'error': results[-1]['error']})
            return
    _pc_emit({'status': 'completed', 'testResults': results})
`;
