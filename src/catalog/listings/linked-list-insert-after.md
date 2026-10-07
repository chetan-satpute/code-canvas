```ts
/*#enter*/ function insertAfter(
  list: LinkedList,
  target: number,
  value: number,
) {
  /*#start*/ let node = list.head;

  /*#search*/ while (node !== null && node.value !== target) {
    /*#advance*/ node = node.next;
  }

  /*#missingCheck*/ if (node === null) {
    /*#missing*/ return;
  }

  /*#create*/ const newNode = new LinkedListNode(value);

  /*#link*/ newNode.next = node.next;
  /*#splice*/ node.next = newNode;
} /*#exit*/
```
