```ts
/*#enter*/ function insertHead(list: LinkedList, value: number) {
  /*#create*/ const node = new LinkedListNode(value);

  /*#link*/ node.next = list.head;
  /*#setHead*/ list.head = node;
} /*#exit*/
```
