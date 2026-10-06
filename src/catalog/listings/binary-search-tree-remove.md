```ts
/*#enter*/ function remove(tree: BinarySearchTree, value: number) {
  /*#start*/ let node = tree.root;
  /*#noParent*/ let parent: TreeNode | null = null;

  /*#search*/ while (node !== null && node.value !== value) {
    /*#setParent*/ parent = node;

    /*#lessCheck*/ if (value < node.value) {
      /*#goLeft*/ node = node.left;
    } else {
      /*#goRight*/ node = node.right;
    }
  }

  /*#missingCheck*/ if (node === null) {
    /*#missing*/ return;
  }

  /*#twoCheck*/ if (node.left !== null && node.right !== null) {
    /*#minParent*/ parent = node;
    /*#minStart*/ let min = node.right;

    /*#minLoop*/ while (min.left !== null) {
      /*#minSetParent*/ parent = min;
      /*#minGoLeft*/ min = min.left;
    }

    /*#copy*/ node.value = min.value;
    /*#retarget*/ node = min;
  }

  /*#child*/ const child = node.left ?? node.right;

  /*#rootCheck*/ if (parent === null) {
    /*#setRoot*/ tree.root = child;
    /*#rootReturn*/ return;
  }

  /*#sideCheck*/ if (parent.left === node) {
    /*#setLeft*/ parent.left = child;
  } else {
    /*#setRight*/ parent.right = child;
  }
} /*#exit*/
```
