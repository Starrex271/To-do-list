/* ============================================================
   DROPDOWN TOGGLE
   ============================================================ */
function toggleDropdown(event, id, anchor) {
    event.preventDefault();
    var list = document.getElementById(id);
    var icon = anchor.querySelector('i');
    var isOpen = list.style.display === 'flex';
    if (isOpen) {
        list.style.display = 'none';
        icon.className = 'ph ph-caret-right';
        anchor.classList.remove('active');
    } else {
        list.style.display = 'flex';
        icon.className = 'ph ph-caret-down';
        anchor.classList.add('active');
    }
}

/* ============================================================
   DARK / LIGHT MODE TOGGLE
   ============================================================ */
var isDark = false;
function switchMode() {
    isDark = !isDark;
    document.body.classList.toggle('dark', isDark);
    var lightPill  = document.getElementById('light-pill');
    var darkPill   = document.getElementById('dark-pill');
    var moonIcon   = document.getElementById('moon-icon');
    var darkLabel  = document.getElementById('dark-label');
    if (isDark) {
        lightPill.style.background = 'transparent';
        lightPill.querySelector('i').style.color   = '#888';
        lightPill.querySelector('span').style.color = '#888';
        darkPill.style.background = '#3a3a3a';
        moonIcon.style.color  = '#fff';
        darkLabel.style.color = '#fff';
    } else {
        lightPill.style.background = '#fff';
        lightPill.querySelector('i').style.color   = '#1a1a1a';
        lightPill.querySelector('span').style.color = '#1a1a1a';
        darkPill.style.background = 'transparent';
        moonIcon.style.color  = '#888';
        darkLabel.style.color = '#888';
    }
}

/* ============================================================
   DRAG-AND-DROP
   ============================================================ */
var dragCard       = null;   // the card element being dragged
var dragSource     = null;   // the .cards container it came from
var ghostEl        = null;   // translucent visual clone
var dropIndicator  = null;   // blue line that shows insert position

/* --- helpers --- */
function getColumnCards(col) {
    return col.querySelector('.cards');
}

function getColumns() {
    return Array.from(document.querySelectorAll('.column'));
}

/* Update every column-title count, e.g. "To do (3)" */
function updateCounts() {
    getColumns().forEach(function(col) {
        var title    = col.querySelector('.column-title');
        var cards    = col.querySelectorAll('.cards .card');
        var text     = title.textContent.replace(/\(\d+\)/, '(' + cards.length + ')');
        title.textContent = text;
    });
}

/* Show/hide the "Drag your task here…" placeholder */
function refreshPlaceholders() {
    getColumns().forEach(function(col) {
        var cards   = getColumnCards(col);
        var ph      = col.querySelector('.drag-placeholder');
        var count   = cards.querySelectorAll('.card').length;
        if (ph) {
            ph.style.display = (count === 0 || (count === 0 && dragCard)) ? 'block' : 'none';
        }
    });
}

/* Create the drop-indicator line */
function ensureDropIndicator() {
    if (!dropIndicator) {
        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-indicator';
    }
    return dropIndicator;
}

/* Find the card (or null) that the pointer is above */
function getCardAfter(container, y) {
    var draggableCards = Array.from(container.querySelectorAll('.card:not(.dragging)'));
    return draggableCards.reduce(function(closest, child) {
        var box    = child.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* ---- mouse events on cards ---- */
function onMouseDown(e) {
    // Only start drag on left-button; ignore clicks on buttons inside the card
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;

    var card = e.target.closest('.card');
    if (!card) return;

    e.preventDefault();

    dragCard   = card;
    dragSource = card.parentElement;

    var rect = card.getBoundingClientRect();

    /* Ghost */
    ghostEl = card.cloneNode(true);
    ghostEl.classList.add('drag-ghost');
    ghostEl.style.width  = rect.width  + 'px';
    ghostEl.style.height = rect.height + 'px';
    ghostEl.style.left   = rect.left   + 'px';
    ghostEl.style.top    = rect.top    + 'px';
    document.body.appendChild(ghostEl);

    /* Offset of pointer inside card */
    ghostEl._ox = e.clientX - rect.left;
    ghostEl._oy = e.clientY - rect.top;

    /* Dim original */
    dragCard.classList.add('dragging');

    ensureDropIndicator();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
}

function onMouseMove(e) {
    if (!dragCard) return;

    /* Move ghost */
    ghostEl.style.left = (e.clientX - ghostEl._ox) + 'px';
    ghostEl.style.top  = (e.clientY - ghostEl._oy) + 'px';

    /* Find which .cards container is under pointer */
    ghostEl.style.pointerEvents = 'none';
    var target = document.elementFromPoint(e.clientX, e.clientY);
    ghostEl.style.pointerEvents = '';

    if (!target) return;

    var container = target.closest('.cards');
    if (!container) return;

    /* Insert drop indicator */
    var after = getCardAfter(container, e.clientY);
    if (after) {
        container.insertBefore(dropIndicator, after);
    } else {
        container.appendChild(dropIndicator);
    }
}

function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);

    if (!dragCard) return;

    /* Place card where indicator is */
    if (dropIndicator && dropIndicator.parentElement) {
        dropIndicator.parentElement.insertBefore(dragCard, dropIndicator);
        dropIndicator.remove();
    }

    /* Clean up */
    dragCard.classList.remove('dragging');
    if (ghostEl) { ghostEl.remove(); ghostEl = null; }

    updateCounts();
    refreshPlaceholders();

    dragCard   = null;
    dragSource = null;
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', function () {
    /* Attach mousedown to the board (event delegation) */
    var board = document.querySelector('.board');
    if (board) {
        board.addEventListener('mousedown', onMouseDown);
    }

    /* Show "Drag your task here..." only in empty columns to start */
    refreshPlaceholders();
});


/* ===== DRAG AND DROP ===== */
(function () {
    var dragCard = null;       // the card being dragged
    var dragSource = null;     // the .cards container it came from
    var indicator = null;      // the blue drop-line element

    function createIndicator() {
        var el = document.createElement('div');
        el.className = 'drop-indicator';
        return el;
    }

    function removeIndicator() {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
        indicator = null;
    }

    // Make all cards (and future cards) draggable
    function initCard(card) {
        if (card.classList.contains('drag-placeholder')) return;
        card.setAttribute('draggable', 'true');

        card.addEventListener('dragstart', function (e) {
            dragCard = card;
            dragSource = card.closest('.cards');
            setTimeout(function () { card.classList.add('dragging'); }, 0);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', function () {
            card.classList.remove('dragging');
            removeIndicator();
            document.querySelectorAll('.cards').forEach(function (c) {
                c.classList.remove('drag-over');
            });
            document.querySelectorAll('.drag-placeholder').forEach(function (p) {
                p.classList.remove('highlight');
            });
            dragCard = null;
            dragSource = null;
        });
    }

    // Get the card or placeholder element at a Y position inside a .cards container
    function getDragAfterElement(container, y) {
        var children = Array.from(container.querySelectorAll('.card:not(.dragging), .drag-placeholder'));
        var result = { element: null, after: true }; // after = append at end

        children.reduce(function (closest, child) {
            var box = child.getBoundingClientRect();
            var offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            }
            return closest;
        }, { offset: -Infinity, element: null });

        // Re-do without reduce confusion
        var best = null;
        var bestOffset = -Infinity;
        children.forEach(function (child) {
            var box = child.getBoundingClientRect();
            var offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > bestOffset) {
                bestOffset = offset;
                best = child;
            }
        });
        return best; // null means "append at end"
    }

    // Handle dragover on a .cards zone
    function onCardsOver(e, cardsEl) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        cardsEl.classList.add('drag-over');

        // Highlight placeholder if it's the only drop target visible
        var placeholder = cardsEl.querySelector('.drag-placeholder');
        if (placeholder) placeholder.classList.add('highlight');

        // Position the drop indicator
        removeIndicator();
        indicator = createIndicator();

        var afterEl = getDragAfterElement(cardsEl, e.clientY);
        if (afterEl === null) {
            // Append before placeholder if exists, else at end
            if (placeholder) {
                cardsEl.insertBefore(indicator, placeholder);
            } else {
                cardsEl.appendChild(indicator);
            }
        } else {
            cardsEl.insertBefore(indicator, afterEl);
        }
    }

    function onCardsLeave(cardsEl) {
        cardsEl.classList.remove('drag-over');
        var placeholder = cardsEl.querySelector('.drag-placeholder');
        if (placeholder) placeholder.classList.remove('highlight');
        removeIndicator();
    }

    function onCardsDrop(e, cardsEl) {
        e.preventDefault();
        if (!dragCard) return;

        cardsEl.classList.remove('drag-over');
        var placeholder = cardsEl.querySelector('.drag-placeholder');
        if (placeholder) placeholder.classList.remove('highlight');

        var afterEl = getDragAfterElement(cardsEl, e.clientY);
        removeIndicator();

        if (afterEl === null) {
            // Insert before placeholder if exists, else append
            if (placeholder) {
                cardsEl.insertBefore(dragCard, placeholder);
            } else {
                cardsEl.appendChild(dragCard);
            }
        } else {
            cardsEl.insertBefore(dragCard, afterEl);
        }

        updateColumnCounts();
    }

    // Keep column header counts accurate after moves
    function updateColumnCounts() {
        document.querySelectorAll('.column').forEach(function (col) {
            var title = col.querySelector('.column-title');
            var count = col.querySelectorAll('.card:not(.drag-placeholder)').length;
            if (title) {
                title.textContent = title.textContent.replace(/\(\d+\)/, '(' + count + ')');
            }
        });
    }

    // Attach listeners to all .cards containers
    function initContainer(cardsEl) {
        cardsEl.addEventListener('dragover', function (e) { onCardsOver(e, cardsEl); });
        cardsEl.addEventListener('dragleave', function (e) {
            // Only fire if truly leaving the container
            if (!cardsEl.contains(e.relatedTarget)) {
                onCardsLeave(cardsEl);
            }
        });
        cardsEl.addEventListener('drop', function (e) { onCardsDrop(e, cardsEl); });
    }

    // Init everything on DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.cards').forEach(initContainer);
        document.querySelectorAll('.card').forEach(initCard);
    });
})();