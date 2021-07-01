import {useProvider} from '../../../infrastructure';
import {OptionRow, OptionsSection, SettingOption} from '../Shared';
import {Checkbox, Dropdown} from '../../atoms';
import * as React from 'react';
import {OptionCardProps} from '../OptionsApp';
import {isFilteredOut} from '../FilterOptionsCard';
import {LoggingSettingType} from "../../../infrastructure/Configuration/Configuration";

const loggingOptions = [
    {value: 'nothing', label: 'Nothing'},
    {value: 'error', label: 'Errors'},
    {value: 'info', label: 'Information'},
    {value: 'debug', label: 'Everything'}
]

export function MiscCard(props: OptionCardProps) {
    const {useLogging, showConversionInBrackets, isPaused} = useProvider()

    if (isFilteredOut(['debug', 'logging', 'brackets', 'misc'], props.filter))
        return <></>

    return <OptionsSection title="Misc">
        <OptionRow>
            <SettingOption title="Allowed logging level" help="You can see logs via F12 > Console">
                <Dropdown value={useLogging.value}
                          options={loggingOptions}
                          onChange={value => useLogging.setAndSaveValue(value as LoggingSettingType)}/>
            </SettingOption>
            <SettingOption key="brackets_option" title="Display conversion in brackets" help="Fx $10 => $10 (10 USD)">
                <Checkbox value={showConversionInBrackets.value}
                          onChange={value => showConversionInBrackets.setAndSaveValue(value)}/>
            </SettingOption>
            <SettingOption key="pause_option" title="Pause this extension" help="Conversions and shortcuts actions will be blocked from happening">
                <Checkbox value={isPaused.value}
                          onChange={value => isPaused.setAndSaveValue(value)}/>
            </SettingOption>
        </OptionRow>
    </OptionsSection>
}