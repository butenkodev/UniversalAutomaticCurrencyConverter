describe('CurrencyRate', () => {
    it(`very old is expired`, () => {
        // Setup
        const rate = new CurrencyRate('', '', 0, new Date(5));
        // Assert
        expect(rate.isExpired).toEqual(true)
    });
    it(`just expired`, () => {
        // Setup
        const rate = new CurrencyRate('', '', 0, new Date(Date.now() - 1000 * 60 * 60 * 24));
        // Assert
        expect(rate.isExpired).toEqual(true)
    });
    it(`just exactly not expired`, () => {
        // Setup
        const rate = new CurrencyRate('', '', 0, new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000));
        // Assert
        expect(rate.isExpired).toEqual(false)
    });
    it(`new isn't expired`, () => {
        // Setup
        const rate = new CurrencyRate('', '', 0, new Date());
        // Assert
        expect(rate.isExpired).toEqual(false)
    });
});