```ts
/*#enter*/ function insert(tree: BinarySearchTree, value: number) {
  /*#emptyCheck*/ if (tree.root === null) {
    /*#setRoot*/ tree.root = new TreeNode(value);
    /*#rootReturn*/ return;
  }

  /*#start*/ let node = tree.root;

  while (true) {
    /*#equalCheck*/ if (value === node.value) {
      /*#duplicate*/ return;
    }

    /*#lessCheck*/ if (value < node.value) {
      /*#leftCheck*/ if (node.left === null) {
        /*#setLeft*/ node.left = new TreeNode(value);
        /*#leftReturn*/ return;
      }

      /*#goLeft*/ node = node.left;
    } else {
      /*#rightCheck*/ if (node.right === null) {
        /*#setRight*/ node.right = new TreeNode(value);
        /*#rightReturn*/ return;
      }

      /*#goRight*/ node = node.right;
    }
  }
} /*#exit*/
```
