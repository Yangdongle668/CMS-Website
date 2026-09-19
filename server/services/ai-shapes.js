// Article shapes — the structural half of the generator.
//
// A hundred articles produced from one skeleton is a hundred articles
// with the same heading sequence, the same table in the same place and
// the same FAQ bolted on the end. A reader notices; a duplicate-content
// check notices harder, because near-identical structure across a whole
// section is the signature of spun content, and it is visible even when
// no two sentences match.
//
// So the structure varies too. Each playbook names a shape, and the
// shape decides the heading sequence, how the piece opens, whether it
// carries a table or a checklist, and whether it ends in an FAQ. Eight
// of the eleven shapes have no FAQ block at all, which is deliberate:
// the FAQ-on-every-post pattern is one of the loudest tells there is.
//
// `sections` is a sequence of instructions, not literal headings. The
// model is told to write its own heading text for each beat — literal
// headings would reintroduce exactly the uniformity this avoids.

const SHAPES = {
  deep_dive: {
    label: 'Deep technical explanation',
    words: [1500, 2100],
    open: 'a specific measurement, tolerance or failure that frames the problem',
    sections: [
      'the mechanism, in plain engineering terms',
      'the parameters that actually constrain a design, with realistic ranges',
      'where the textbook model stops matching the bench',
      'what to specify as a result',
    ],
    table: 'one comparison or parameter table where it genuinely helps',
    close: 'a short numbered checklist the reader can act on',
    faq: false,
  },

  decision_framework: {
    label: 'Decision framework',
    words: [1200, 1700],
    open: 'the decision the reader is stuck on, stated as a question they have actually asked',
    sections: [
      'the two or three variables that decide it, and why the others are noise',
      'each option on its merits, honestly, including what it costs you',
      'the cases where the obvious answer is wrong',
    ],
    table: null,
    close: 'an if/then decision list mapping situations to choices',
    faq: false,
  },

  comparison: {
    label: 'Head-to-head comparison',
    words: [1300, 1800],
    open: 'the trade-off named in one sentence, without hedging',
    sections: [
      'how each option is built, briefly',
      'where the first option wins, with the conditions stated',
      'where the second wins, same treatment',
      'the cases that are genuinely close, and the tiebreaker',
    ],
    table: 'a spec-by-spec table with realistic figures and stated test conditions',
    close: 'a verdict by reader profile, not a single winner',
    faq: true,
  },

  failure_analysis: {
    label: 'Failure mode analysis',
    words: [1300, 1800],
    open: 'the symptom as the reader first sees it, before the cause is known',
    sections: [
      'what is physically happening',
      'the conditions that trigger it, ranked by how often they are the real cause',
      'how to tell this failure apart from the ones it resembles',
      'the design and process changes that prevent it',
    ],
    table: null,
    close: 'a diagnostic sequence, in order, ending in what to measure',
    faq: false,
  },

  spec_walkthrough: {
    label: 'Standard or specification walkthrough',
    words: [1400, 2000],
    open: 'what the document is for and what it does not cover',
    sections: [
      'the scope and what falls outside it',
      'the test or clause sequence, in the order it is actually run',
      'the clauses that most often cause a failure, and why',
      'what evidence to ask a supplier for, precisely',
    ],
    table: null,
    close: 'a planning list with realistic sequencing, not durations invented for effect',
    faq: true,
  },

  buyer_guide: {
    label: 'Procurement guide',
    words: [1200, 1700],
    open: 'the question a buyer is being asked to sign off, and what they are missing',
    sections: [
      'what to specify, in the language a supplier can quote against',
      'what a quote leaves out and how to surface it',
      'the commercial terms that matter more than unit price',
    ],
    table: null,
    close: 'a request-for-quote checklist that can be pasted into an email',
    faq: false,
  },

  process_spec: {
    label: 'Manufacturing or process note',
    words: [1200, 1700],
    open: 'the process step and the window it has to stay inside',
    sections: [
      'why the window is where it is',
      'what happens either side of it, concretely',
      'how the process is monitored and what the control limits mean',
    ],
    table: 'a parameter window table if the process has more than three variables',
    close: 'a qualification sequence for a reader adopting this process',
    faq: false,
  },

  field_notes: {
    label: 'Field notes',
    words: [900, 1400],
    open: 'a pattern seen repeatedly across programmes, stated plainly',
    sections: [
      'what the pattern looks like from the outside',
      'what is usually underneath it',
      'what the teams that avoid it do differently',
    ],
    table: null,
    close: 'a short list of things worth checking on your own programme',
    faq: false,
  },

  market_note: {
    label: 'Market or supply-chain note',
    words: [1000, 1500],
    open: 'the change, dated and specific, with no editorialising',
    sections: [
      'what actually changed, separating fact from forecast',
      'the mechanism by which it reaches a buyer',
      'what is still uncertain, said clearly',
    ],
    table: null,
    close: 'what to do in the next quarter, and what to wait on',
    faq: false,
  },

  integration_guide: {
    label: 'Integration guide',
    words: [1300, 1800],
    open: 'the interface between two subsystems and who owns it',
    sections: [
      'the electrical and mechanical constraints each side imposes',
      'the decisions that are expensive to reverse later',
      'what belongs on the drawing so it is not built to an assumption',
    ],
    table: null,
    close: 'a drawing and handover checklist',
    faq: false,
  },

  myth_correction: {
    label: 'Correcting a common belief',
    words: [900, 1400],
    open: 'the belief, stated fairly and in the form the reader holds it',
    sections: [
      'where it came from and the case in which it was true',
      'what changed, or what was always misread',
      'what is actually true, with the conditions attached',
    ],
    table: null,
    close: 'the practical difference this makes to a decision',
    faq: false,
  },
};

function getShape(key) {
  return SHAPES[key] || SHAPES.deep_dive;
}

// Opening-line modes. A rotating constraint on the first sentence,
// because the opening is where a generated article most reliably gives
// itself away — every model reaches for the same "In today's rapidly
// evolving..." cadence unless told not to, and telling it not to once
// produces a different but equally uniform habit.
const OPENERS = [
  'Open on a number and what it means. No scene-setting.',
  'Open on a mistake that is common and expensive. Name it in the first clause.',
  'Open by stating the conclusion, then spend the article earning it.',
  'Open with the question a customer asked, quoted plainly.',
  'Open on a constraint from physics or a standard, and let it set the terms.',
  'Open by contradicting something the reader probably believes.',
  'Open on what the datasheet says, then on what the bench says.',
  'Open with the decision the reader has to make this week.',
];

function openerFor(index) {
  return OPENERS[index % OPENERS.length];
}

module.exports = { SHAPES, getShape, OPENERS, openerFor };
