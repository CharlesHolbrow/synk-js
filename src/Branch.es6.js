/**
 * Default Leaf object. If an object is created on 
 */
class Leaf {
  /**
   * @param {string} key - The objects key
   * @param {object} state - the objects initial state
   * @param {synk-js.Objects} synkObjects - the parent synk-js Objects container
   */
  constructor(key, state) {
    this.state = {};
    this.update(state);
  }
  /**
   * Update is called when the server changes the object
   * @param {object} diff - changes to be applied to the object
   */
  update(diff) {
    Object.assign(this.state, diff);
  }

  /**
   * Called when the object will be destroyed or removes from the current
   * subscription. Your implementation of this function must remove references
   * to the object from your project so that the object will be garbage
   * collected correctly.
   */
  teardown() {
    console.log('teardown:', this);
  }
}

/**
 * Branch is part of a tree-like Data structure. Each branch contains any number
 * of children. Each child is either a Branch or a Leaf. Each child is
 * identified by a name string. In this implementation, Leaves are any
 * javascript Object that satisfy the Leaf interface above.
 *
 * Each Branch has a special property called 'class'. This is the recommended
 * class for Leaf objects. Leaf objects may or may not be created with the
 * recommended class. When we create new Branches with `b.create(...)`, child
 * branches inherit the parent's 'class' property.
 */
export default class Branch {
  /**
   * @param {Class} [cls] - Optional class. Default is Object.
   */
  constructor(cls) {
    this.branches = {};
    this.leaves = {};
    this._class = cls || Leaf;
  }

  /**
   * Retrieve the recommended class for child leaves attached to this object.
   */
  get class() {
    return this._class;
  }

  /**
   * Update the Branches class. Throw if v is not a function.
   * @param {function} v - the constructable function
   */
  set class(v) {
    if (typeof v !== 'function') throw new Error('Class must be a function');
    this._class = v;
  }

  /**
   * Returns the Branch or identified by a name. The example below returns
   * the child identified by the name 'alice'. If 'alice' does not exist on the
   * Branch, a new child Branch called 'alice' will be created.
   *
   * `b.get('alice') \\ returns the branch or child named alice`
   *
   * A longer address can be specified in the format below. This will create new
   * Branches and sub-Branches if needed:
   *
   * `b.get('alice', 'ice cream' 'other')`
   *
   * In any format, the last name specified may be the name of an existing Leaf.
   * All preceeding names must be Branch names.
   *
   * @param {String} n1 - the name we are trying to get.
   * @param {...String} n2 - remaining sub branch names.
   * @returns {Branch} - the Branch or Leaf we requested.
   */
  createBranch(n1, ...n2) {
    if (n1 === undefined) return this;

    if (!this.branches.hasOwnProperty(n1)) {
      // We now know that the value at this[n1] is not our 'own' property.
      // It is either not present, or n1 is not a valid name.
      if (this.branches[n1] === undefined)
        this.branches[n1] = new Branch(this.class);
      else
        throw new Error(`Illegal branch name: ${n1}`);
    }

    // We know n1 exists, and is a valid name.
    if (!n2 || !n2.length) return this.branches[n1];

    return this.branches[n1].createBranch(...n2);
  }

  /**
   * Recursively step through the tree. If any Branch is found that has no
   * leaves, remove that branch.
   * @returns {Number} - the number of objects that were removed.
   */
  trim() {
    let count = 0;

    for (const name of Object.keys(this.branches)) {
      count = count + this.branches[name].trim();
      if (!Object.keys(this.branches[name].leaves).length) {
        delete this.branches[name];
        count++;
      }
    }

    return count;
  }

  /**
   * Recursively iterate over this branch, and call a function on each leaf. The
   * function will be called in the format:
   *
   * `f(leaf, ...args)`
   *
   * @param {function} f - predicate function will be called with each leaf
   * @param {...any} args - additional arguments to the predicate function
   */
  forEach(f, ...args) {
    for (const name of Object.keys(this.branches))
      this.branches[name].forEach(f, ...args);
    for (const name of Object.keys(this.leaves))
      f(this.leaves[name], ...args);
  }

  /**
   * Retrieve a branch by its address. Example:
   *
   * `b.get('alice', 'bob', 'cat'); // Get this.alice.bob.cat`
   *
   * @param {...String} all - the address of Branch to get.
   * @returns {Branch|Object|null} - A Branch or Leaf. Null if not found
   */
  getBranch(...all) {
    if (!all || all.length === 0) return this;
    else if (all.length === 1) {
      if (this.branches.hasOwnProperty(all[0])) return this.branches[all[0]];

      return null;
    }

    const first = this.branches[all[0]];

    if (first instanceof Branch) return first.getBranch(...all.slice(1));

    return null;
  }

  /**
   * Remove a child Branch from this branch. If we specify a longer address,
   * only the tip of the address specified will be removed. The example below
   * removes 'cat' from 'bob', but does not remove 'bob' from 'alice'.
   *
   * `b.remove('alice', 'bob', 'cat')`
   *
   * @param {...String} all - the address of the Branch or Leaf we want to
   *        remove. The parent of this object must be a Branch.
   * @returns {Branch|null} - The Branch that was removed. Null if not found.
   */
  removeBranch(...all) {
    let parent;

    if (all.length === 1)
      parent = this;
    else
      parent = this.getBranch(...all.slice(0, -1));

    if (!parent)
      return null;

    const name = all[all.length - 1];

    if (!parent.branches.hasOwnProperty(name))
      return null;

    const obj = parent.branches[name];

    delete parent.branches[name];

    return obj;
  }

  /**
   * Non recursive leaf retrevial. Returns null if the branch has no children
   * with the given name, OR if the name points to another branch
   * @param {String|null} name - the name of the leaf we are looking for;
   * @returns {Object|null} - null if this does not have a branch
   */
  getLeaf(name) {
    if (this.leaves.hasOwnProperty(name))
      return this.leaves[name];

    return null;
  }

  /**
   * Set a Leaf in this branch.
   * @param {String} name - Name of the object we are interested in
   * @param {Object} obj - Object we are setting.
   */
  setLeaf(name, obj) {
    if (obj === null || obj === undefined)
      this.removeLeaf(name);
    else
      this.leaves[name] = obj;
  }

  /**
   * @param {String} name - key name of the leaf to remove
   */
  removeLeaf(name) {
    delete this.leaves[name];
  }
}
