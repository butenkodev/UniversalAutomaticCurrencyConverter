const convertedTag = 'UACC_converted';
const ignoredElements = {
    'script': true,
    'rect': true,
    'svg': true
};
let mouseIsOver = null;

class UACCContent {
    constructor() {
        this.engine = new Engine();
        this.detector = this.engine.currencyDetector;
        this.loader = this.engine.loadSettings();
        this._conversions = [];
    }

    get conversionCount() {
        return this._conversions.length;
    }

    setAll(converted) {
        const self = this;
        if (this.engine.highlighter.isEnabled)
            this._conversions.forEach(e => {
                e.UACCSetter(converted);
                self.highlightConversion(e).finally();
            });
        else
            this._conversions.forEach(e => e.UACCSetter(converted));
    }

    async highlightConversion(element) {
        const highlighter = this.engine.highlighter;
        const duration = highlighter.duration;
        const oldColor = element.style.backgroundColor;
        element.classList.add('highlighted');
        element.style.backgroundColor = highlighter.color;
        await Utils.wait(duration);
        element.classList.add('hiddenHighlight');
        element.style.backgroundColor = oldColor;
        await Utils.wait(5 * duration);
        element.classList.remove('highlighted', 'hiddenHighlight');
    }

    hasChildrenBeyond(element, limit, depth = 0) {
        if (!element || !element.children) return false;
        const children = element.children;

        if (limit <= depth)
            return children.length > 0;

        for (let i = 0; i < children.length; i++)
            if (this.hasChildrenBeyond(children[i], limit, depth + 1))
                return true;

        return false;
    }

    childrenHasCurrency(element) {
        for (let i = 0; i < element.children.length; i++)
            if (this.engine.currencyDetector.contains(element.children[i]))
                return true;
        return false;
    }

    convertElement(element, full = false) {
        const replacements = this.detector.findAll(element, full);
        return replacements.reduce((a, b) => a.replace(b.raw, this.engine.transform(b)), element.innerText);
    }

    transformElement(element, full = false) {
        if (!element) return;
        element.setAttribute(convertedTag, 'true');
        const newText = this.convertElement(element, full);
        const oldText = element.innerHTML;
        element.classList.add('clickable');
        element.addEventListener('mouseout', () => mouseIsOver = null);
        element.addEventListener('mouseover', () => mouseIsOver = element);

        let isNew = false;
        const setToOld = () => {
            element.innerHTML = oldText;
            isNew = false;
        };
        const setToNew = () => {
            element.innerText = newText;
            isNew = true;
        };
        const set = value => value ? setToNew() : setToOld();
        const change = () => isNew ? setToOld() : setToNew();

        this._conversions.push(element);

        change();

        element.UACCChanger = change;
        element.UACCSetter = set;

        element.addEventListener('click', () => change());
        if (this.engine.highlighter.isEnabled)
            this.highlightConversion(element)
                .catch(e => Utils.logError(e));
    }

    convertElements(start) {
        const queue = [start];
        const detector = this.engine.currencyDetector;

        while (queue.length > 0) {
            const curr = queue.pop();

            if (ignoredElements[curr.tagName])
                continue;

            if (this.hasChildrenBeyond(curr, 3)) {
                for (let i = 0; i < curr.children.length; i++)
                    queue.push(curr.children[i]);
                continue;
            }

            if (!detector.contains(curr)) {
                continue;
            }

            if (detector.contains(curr, true)) {
                if (!curr.children || (curr.children.length === 1 && curr.innerText !== curr.children[0].innerText)) {
                    this.transformElement(curr, true);
                    continue;
                }
            }

            if (this.childrenHasCurrency(curr)) {
                for (let i = 0; i < curr.children.length; i++)
                    queue.push(curr.children[i]);
                continue;
            }

            this.transformElement(curr);
        }
    }
}

Timer.start('Loading settings');
const runner = new UACCContent();
chrome.runtime.onMessage.addListener(function (data, sender, senderResponse) {
    switch (data.method) {
        case 'convertAll':
            runner.setAll(data.converted);
            senderResponse();
            break;
        case 'conversionCount':
            senderResponse(runner.conversionCount);
            break;
        case 'getUrl':
            senderResponse(window.location.href);
            break;
    }
    return true;
});
runner.loader.then(r => {
    Timer.log('Loading settings');
    return r;
});

runner.loader.finally(() => {
    const engine = runner.engine;

    if (!engine.isEnabled)
        return Utils.log('content', 'UACC is disabled');

    if (engine.blacklist.isBlacklisted(window.location.href))
        return;

    Timer.start('Localization');
    engine.currencyDetector.localize(Browser.getHost(), document.body.innerText);
    Timer.log('Localization');

    if (engine.automaticPageConversion) {
        Timer.start('Converting page');
        runner.convertElements(document.body);
        Timer.log('Converting page');

        Browser.messagePopup({
            method: 'conversionCount',
            count: runner.conversionCount
        }).finally();

        const observer = new MutationObserver(function (mutations) {
            for (let i = 0; i < mutations.length; i++)
                for (let j = 0; j < mutations[i].addedNodes.length; j++) {
                    const parent = mutations[i].addedNodes[j].parentElement;
                    if (parent && parent.hasAttribute(convertedTag))
                        continue;
                    runner.convertElements(mutations[i].addedNodes[j]);
                }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        // Add event on keyup to look for shortcut to convert back
        window.addEventListener("keyup", e => {
            // Secure element in case it changes between check and execution
            const securedOver = mouseIsOver;
            if (e.key === engine.conversionShortcut && securedOver) securedOver.UACCChanger();
        }, false);
    } else {
        window.addEventListener("keyup", e => {
            // Secure element in case it changes between check and execution
            const securedOver = mouseIsOver;
            if (e.key !== engine.conversionShortcut)
                return;

            if (securedOver)
                return securedOver.UACCChanger();

            let parent;
            if (!(parent = window.getSelection()))
                return;

            if (!(parent = parent.anchorNode))
                return;
            if (!(parent = parent.parentElement))
                return;
            if (!(parent = parent.parentElement))
                return;

            runner.convertElements(parent);
            parent.setAttribute(convertedTag, 'true');
        }, false);
    }
    Timer.log();
});