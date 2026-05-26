(function (window) {
    "use strict";

    /* ------------------------------------------------------------
     *  Helpers
     * ------------------------------------------------------------ */

    function toBoolYN(v, def) {
        if (v === 'Y') return true;
        if (v === 'N') return false;
        return !!def;
    }

    function qsa(root, sel) {
        if (!root || !sel) return [];
        try {
            return Array.from(root.querySelectorAll(sel));
        } catch (e) {
            console.warn('[MasterSwitch] Invalid selector:', sel, e);
            return [];
        }
    }

    function alreadyBound(el, flag) {
        if (!el) return false;
        if (el.dataset[flag] === '1') return true;
        el.dataset[flag] = '1';
        return false;
    }

    // Prosta walidacja nazwy zdarzenia (opcjonalna, ale pomaga unikać błędów literowych)
    function normalizeEventName(name) {
        if (!name || typeof name !== 'string') return '';
        const trimmed = name.trim();
        // Dozwolone: litera na początku, potem litery/cyfry/underline/myślnik/kropka/dwukropek
        const ok = /^[A-Za-z][\w\-:.]*$/.test(trimmed);
        if (!ok) {
            console.warn('[MasterSwitch] Invalid custom event name:', name,
                'Expected pattern: ^[A-Za-z][\\w\\-:.]*$');
            return '';
        }
        return trimmed;
    }

    function dispatchCustom(target, name, detail, bubbles = true) {
        if (!target || !name) return;
        try {
            const evt = new CustomEvent(name, { detail, bubbles });
            target.dispatchEvent(evt);
        } catch (e) {
            console.warn('[MasterSwitch] Failed to dispatch custom event:', name, e);
        }
    }

    /* ------------------------------------------------------------
     *  Master → Group
     * ------------------------------------------------------------ */
    function applyMasterToGroup(masterEl, groupEl, checkboxSel, exclDisabled, propagate, indClass, genEvtName) {

        masterEl.indeterminate = false;
        masterEl.classList.remove(indClass);
        masterEl.setAttribute('aria-checked', masterEl.checked ? 'true' : 'false');

        const allBoxes = qsa(groupEl, checkboxSel);
        const boxes = exclDisabled ? allBoxes.filter(cb => !cb.disabled) : allBoxes;

        let anyChanged = false;
        let changedCount = 0;

        for (const cb of boxes) {
            if (cb.checked !== masterEl.checked) {
                cb.checked = masterEl.checked;
                anyChanged = true;
                changedCount++;
            }
        }

        // (1) Opcjonalna propagacja "change" — 1 zdarzenie na grupie
        if (propagate && anyChanged) {
            groupEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // (2) Dodatkowy, niestandardowy event, gdy podano nazwę — 1 zdarzenie na grupie
        if (genEvtName && anyChanged) {
            const detail = {
                source: 'master',                     // kto zainicjował zmianę
                masterChecked: !!masterEl.checked,
                masterIndeterminate: !!masterEl.indeterminate,
                total: boxes.length,
                changedCount,
                excludeDisabled: !!exclDisabled,
                checkboxSelector: checkboxSel,
                timestamp: Date.now()
            };
            dispatchCustom(groupEl, genEvtName, detail, /*bubbles*/true);
        }
    }

    /* ------------------------------------------------------------
     *  Group → Master
     * ------------------------------------------------------------ */
    function recomputeMasterState(masterEl, groupEl, checkboxSel, exclDisabled, indClass, genEvtName) {

        const allBoxes = qsa(groupEl, checkboxSel);
        const boxes = exclDisabled ? allBoxes.filter(cb => !cb.disabled) : allBoxes;

        const total = boxes.length;
        const checked = boxes.filter(cb => cb.checked).length;

        if (total === 0 || checked === 0) {
            masterEl.checked = false;
            masterEl.indeterminate = false;
            masterEl.classList.remove(indClass);
            masterEl.setAttribute('aria-checked', 'false');
        }
        else if (checked === total) {
            masterEl.checked = true;
            masterEl.indeterminate = false;
            masterEl.classList.remove(indClass);
            masterEl.setAttribute('aria-checked', 'true');
        }
        else {
            masterEl.checked = false;
            masterEl.indeterminate = true;
            masterEl.classList.add(indClass);
            masterEl.setAttribute('aria-checked', 'mixed');
        }

        // Po przeliczeniu stanu Mastera – wyślij niestandardowy event (jeśli zdefiniowano)
        if (genEvtName) {
            const detail = {
                source: 'group',
                masterChecked: !!masterEl.checked,
                masterIndeterminate: !!masterEl.indeterminate,
                total,
                checked,
                excludeDisabled: !!exclDisabled,
                checkboxSelector: checkboxSel,
                timestamp: Date.now()
            };
            dispatchCustom(groupEl, genEvtName, detail, /*bubbles*/true);
        }
    }

    /* ------------------------------------------------------------
     *  INIT
     * ------------------------------------------------------------ */
    function init(
        daCtx,
        masterSel, groupSel, checkboxSel,
        exclDisabledYN, propagateYN, initOnLoadYN,
        indClass,
        generateEventName
    ) {
        const act = daCtx && daCtx.action ? daCtx.action : null;

        // fallback z DA (gdy wywołanie z PL/SQL ma puste parametry)
        if ((!masterSel || masterSel === '') && act) {
            masterSel        = act.attribute01 || masterSel;
            groupSel         = act.attribute02 || groupSel;
            checkboxSel      = act.attribute03 || checkboxSel;
            exclDisabledYN   = act.attribute04 || exclDisabledYN;
            propagateYN      = act.attribute05 || propagateYN;
            initOnLoadYN     = act.attribute06 || initOnLoadYN;
            indClass         = act.attribute07 || indClass;
            generateEventName = act.attribute08 || generateEventName;
        }

        if (!masterSel) { console.warn('[MasterSwitch] Missing masterSel.'); return; }
        if (!groupSel)  { console.warn('[MasterSwitch] Missing groupSel.');  return; }

        const excludeDisabled     = toBoolYN(exclDisabledYN, true);
        const propagateChange     = toBoolYN(propagateYN, false);
        const initOnLoad          = toBoolYN(initOnLoadYN, true);
        const indeterminateClass  = indClass || 'is-indeterminate';
        const genEvtName          = normalizeEventName(generateEventName);

        const masterEl = document.querySelector(masterSel);
        const groupEl  = document.querySelector(groupSel);

        if (!masterEl) { console.warn('[MasterSwitch] Master not found:', masterSel); return; }
        if (!groupEl)  { console.warn('[MasterSwitch] Group not found:', groupSel); return; }

        const masterFlag = 'mocMsBoundMaster';
        const groupFlag  = 'mocMsBoundGroup';

        const boundMaster = alreadyBound(masterEl, masterFlag);
        const boundGroup  = alreadyBound(groupEl, groupFlag);

        /* --- Master → Group (APEX event + custom event) --- */
        if (!boundMaster) {
            apex.jQuery(masterEl).on('apexafterchange change input', function () {
                applyMasterToGroup(
                    masterEl,
                    groupEl,
                    checkboxSel,
                    excludeDisabled,
                    propagateChange,
                    indeterminateClass,
                    genEvtName
                );
            });
        }

        /* --- Group → Master (custom event po przeliczeniu) --- */
        if (!boundGroup) {
            groupEl.addEventListener('change', (e) => {
                const cb = e.target;
                if (!cb || !cb.matches || !cb.matches(checkboxSel)) return;
                recomputeMasterState(
                    masterEl,
                    groupEl,
                    checkboxSel,
                    excludeDisabled,
                    indeterminateClass,
                    genEvtName
                );
            });
        }

        /* --- Inicjalizacja po załadowaniu strony --- */
        if (initOnLoad) {
            recomputeMasterState(
                masterEl,
                groupEl,
                checkboxSel,
                excludeDisabled,
                indeterminateClass,
                genEvtName
            );
        }
    }

    window.MasterSwitch = { init };

})(window);