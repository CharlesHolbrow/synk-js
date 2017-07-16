import Kefir from 'Kefir';

/**
 * Test
 */
export default class DeleteMe {
  /**
   * This is just a test
   */
  constructor() {
    console.log('this is just for testing purposes');
    Kefir.sequentially(300, [1, 2, 3, 4, 5, 6, 7]).log();
  }
}
