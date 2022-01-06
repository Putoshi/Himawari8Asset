let instance = null;

class Queue {
  constructor() {
    if (instance !== null) throw new Error('SingleTon.getInstance()!!!');
    if (instance === null) instance = this;

    this.queue = Promise.resolve(true);

    return instance;
  }

  add(job) {
    this.queue =  this.queue.then(job);
  }

  static getInstance() {
    if (instance === null) instance = new Queue();
    return instance;
  }
}

module.exports = Queue.getInstance();