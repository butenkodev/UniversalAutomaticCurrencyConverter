import {CurrencyLocalization} from '../src/CurrencyConverter/Localization/CurrencyLocalization';
import {SyncSetting} from '../src/Infrastructure/Configuration/SyncSetting';
import useMockContainer from './Container.mock';
import {ActiveLocalization} from '../src/CurrencyConverter/Localization';

describe('ActiveLocalization', () => {
    [
        {input: 'AAA', expect: 'AAA'},
        {input: 'AAAA', expect: ''},
        {input: 'AA', expect: ''},
        {input: 'Q.Q', expect: ''},
        {input: 'USD', expect: 'USD'},
        {input: '123', expect: ''},
        {input: 'aaa', expect: ''},
        {input: 'aaaa', expect: ''},
    ].forEach(test => it(`Override ${test.input} => ${test.expect}`, () => {
        // Setup
        const [container, provider] = useMockContainer();
        const setting = new SyncSetting<string>(provider, '', '', () => true)
        const localization = new CurrencyLocalization(provider, '', setting);

        // Act
        localization.override(test.input)

        // Assert
        expect(localization.value).toBe(test.expect)
    }));

    [
        {input: 'AAA', expect: true},
        {input: '', expect: false},
    ].forEach(test => it(`Conflict ${test.input} => ${test.expect}`, () => {
        // Setup
        const [container, provider] = useMockContainer();
        const setting = new SyncSetting<string>(provider, '', '', () => true)
        const localization = new CurrencyLocalization(provider, '', setting);
        localization.override(test.input)

        // Assert
        expect(localization.hasConflict()).toBe(test.expect)
    }));

    [
        {input: 'AAA', expect: false},
    ].forEach(test => it(`Reset removes conflict ${test.input} => ${test.expect}`, () => {
        // Setup
        const [container, provider] = useMockContainer();
        const setting = new SyncSetting<string>(provider, '', '', () => true)
        const localization = new CurrencyLocalization(provider, '', setting);
        localization.override(test.input)

        // Act
        localization.reset()

        // Assert
        expect(localization.hasConflict()).toBe(test.expect)
    }));

    it(`Save`, async () => {
        // Setup
        const [container, provider] = useMockContainer();
        const localization = provider.activeLocalization;
        spyOn(localization.krone, 'save')
        spyOn(localization.yen, 'save')
        spyOn(localization.dollar, 'save')

        // Act
        await localization.save();

        // Assert
        expect(localization.krone.save).toHaveBeenCalled()
        expect(localization.yen.save).toHaveBeenCalled()
        expect(localization.dollar.save).toHaveBeenCalled()
    })
});