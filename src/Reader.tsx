import * as React from 'react';
import { observer } from 'mobx-react';
import KeyHandler from 'react-key-handler';
import Modal = require('react-modal');
const NextArrow = require('./NextArrow.png');
const BackArrow = require('./BackArrow.png');
import Store from './Store';
import SharedBook from './SharedBook';
import './Reader.css';

// Reader component
interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
  align: string;
}

interface ReaderContentProps {
  book: SharedBook;
  box: Box;
  pageno: number;
  store: Store;
}

// make it easier to write typed CSS
// seems like a bug: https://github.com/Microsoft/TypeScript/issues/11465
const absolute = 'absolute' as 'absolute';

const PageNavButtons = observer(function PageNavButtons(props: {store: Store}) {
  if (props.store.pageTurnVisible) {
    return (
      <div>
        <button className="next-link" onClick={props.store.nextPage}>
          <img src={NextArrow} alt="next"/>Next
        </button>
        <button className="back-link" onClick={props.store.backPage}>
          <img src={BackArrow} alt="back"/>Back
        </button>
      </div>
    );
  } else {
    return null!;
  }
});

const ReaderContent = observer(function ReaderContent(props: ReaderContentProps) {
  const {book, box, pageno, store} = props;
  const {width, height, top, left} = box; 
  const fontSize = width / height < 4 / 3 ? width / 36 : height / 36;
  let pageStyle = {
    width, height, top, left, fontSize
  };
  if (pageno > store.npages) {
    // past the end
    return (
      <div className="book-page" style={pageStyle}>
        <h1 className="title">What would you like to do now?</h1>
        <div className="choices">
          <button onClick={e => store.setPage(1)}>Read this book again</button>
          <button>Read another book</button>
          <button>Go to Tar Heel Reader</button>
        </div>
      </div>
    );
  }
  const page = book.pages[pageno - 1];
  const textHeight = pageno === 1 ? 4 * fontSize + 8 : 6.5 * fontSize;
  const maxPicHeight = height - textHeight;
  const maxPicWidth = width;
  const verticalScale = maxPicHeight / page.height;
  const horizontalScale = maxPicWidth / page.width;
  let picStyle = {};
  if (verticalScale < horizontalScale) {
    picStyle = {
      height: maxPicHeight
    };
  } else {
    picStyle = {
      width: maxPicWidth,
      marginTop: pageno === 1 ? 0 : (maxPicHeight - horizontalScale * page.height)
    };
  }

  if (pageno === 1) {
    let titleStyle = {
      height: 4 * fontSize,
      fontSize: 2 * fontSize,
      padding: 0,
      margin: 0,
      display: 'block'
    };
    return (
      <div className="book-page" style={pageStyle}>
        <h1 className="title" style={titleStyle}>{book.title}</h1>
        <img 
         src={'https://tarheelreader.org' + book.pages[0].url} 
         className="pic" 
         style={picStyle}
         alt=""
        />
        <PageNavButtons store={store}/>
      </div>
    );
  } else {
    return (
      <div className="book-page" style={pageStyle}>
        <p className="page-number">{pageno}</p>
        <img
          src={'https://tarheelreader.org' + page.url}
          className="pic"
          style={picStyle}
          alt=""
        />
        <div className="caption-box">
          <p className="caption">{page.text}</p>
        </div>
        <PageNavButtons store={store}/>
      </div>
    );
  }
});

interface WordIconProps {
  word: string;
  index: number;
  style: React.CSSProperties;
  store: Store;
  doResponse: (word: string) => void;
}

const WordIcon = observer(function WordIcon(props: WordIconProps) {
  const { word, index, style, store, doResponse } = props;
  const maxSize = Math.min(style.width, style.height);
  const fontSize = maxSize / 5;
  const iconSize = maxSize - fontSize - 10;
  const iStyle = {
    width: iconSize
  };
  const cStyle = {
    fontSize,
    marginTop: -fontSize / 4
  };
  const isFocused = store.responseIndex === index;
  return (
    <button
      className={`iconButton ${isFocused ? 'selected' : ''}`}
      onClick={() => doResponse(word)}
      style={style}
      onFocus={(e) => store.setResponseIndex(index)}
    >
      <figure>
        <img
          src={process.env.PUBLIC_URL + '/symbols/' + word + '.png'}
          alt={word}
          style={iStyle}
        />
        <figcaption style={cStyle}>{word}</figcaption>
      </figure>
    </button>
  );
});

interface WordsProps {
  store: Store;
  boxes: Array<Box>;
  responses: Array<string>;
  doResponse: (word: string) => void;
}

const Words = observer(function Words(props: WordsProps) {
  const {store, boxes, responses, doResponse } = props;
  var words = responses;
  var index = 0;

  return (
    <div>
    { boxes.map((box, i) => {
    const nchunk = Math.floor(words.length / (boxes.length - i));
    const chunk = words.slice(0, nchunk);
    words = words.slice(nchunk);
    const { pax, sax } = {'v': { pax: 'height', sax: 'width' },
                          'h': { pax: 'width', sax: 'height' }}[box.align];
    var bstyle = {};
    bstyle[pax] = box[pax] / nchunk;
    bstyle[sax] = box[sax];
    const dstyle = { top: box.top, left: box.left, width: box.width, height: box.height,
      position: absolute };
    return (
      <div key={i} style={dstyle}>
        {
          chunk.map((w, j) => {
            return (
              <WordIcon
                key={w}
                word={w}
                index={index++}
                style={bstyle}
                store={store}
                doResponse={doResponse}
              />
            );
          })
        }
      </div>
    );
  })
    }
  </div>);
});

interface NRKeyHandlerProps {
  keyValue: string;
  onKeyHandle: (e: Event) => void;
}

@observer
class NRKeyHandler extends React.Component<NRKeyHandlerProps, void> {
  isDown = false;
  keyDown = (e: Event) => {
    e.preventDefault();
    if (!this.isDown) {
      this.isDown = true;
      this.props.onKeyHandle(e);
    }
  }
  keyUp = (e: Event) => {
    this.isDown = false;
  }
  render() {
    const keyValue = this.props.keyValue;
    return (
      <div>
        <KeyHandler
          keyEventName={'keydown'}
          keyValue={keyValue}
          onKeyHandle={this.keyDown}
        />
        <KeyHandler
          keyEventName={'keyup'}
          keyValue={keyValue}
          onKeyHandle={this.keyUp}
        />
      </div>
    );
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const Layout = observer(function Layout(props: {store: Store}) {
  const store = props.store;
  const sides = ['left', 'right', 'top', 'bottom'];
  const onCheck = (e: React.FormEvent<HTMLInputElement>) =>
    store.setLayout(e.currentTarget.name, e.currentTarget.checked);
  return (
    <fieldset>
      <legend>Layout</legend>
      {
        sides.map(side => (
          <label key={side}>{capitalize(side)}:
            <input
              name={side}
              type="checkbox"
              checked={store.layout[side]}
              onChange={onCheck}
            />
          </label>))
      }
    </fieldset>);
});

interface ReadingSelectProps {
  value: number;
  max: number;
  set: (value: number) => void;
}

const ReadingSelector = observer(function ReadingSelector(props: ReadingSelectProps) {
  const { value, max, set } = props;
  const spelled = [ 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
                    'eleventh', 'twelth' ];
  const options = spelled.slice(0, max).map((option, i) => (
    <option key={option} value={i} >{option}</option>));
  return (
    <select value={value} onChange={(e) => set(+e.target.value)}>
      {options}
    </select>
  );
});
  
const Controls = observer(function Controls(props: {store: Store}) {
  const store = props.store;
  const customStyles = {
    content : {
      top                   : '50%',
      left                  : '50%',
      right                 : 'auto',
      bottom                : 'auto',
      marginRight           : '-50%',
      transform             : 'translate(-50%, -50%)'
    },
    overlay: {
      backgroundColor   : 'rgba(255, 255, 255, 0.0)'
    }
  };
  function triggerResponse() {
    let selectedResponse = document.getElementsByClassName('iconButton selected')[0] as
      HTMLElement;
    selectedResponse.click();
  }

  return (
    <div>
      <NRKeyHandler
        keyValue={'ArrowRight'}
        onKeyHandle={store.nextPage}
      />
      <NRKeyHandler
        keyValue={'ArrowLeft'}
        onKeyHandle={store.backPage}
      />
      <NRKeyHandler
        keyValue={' '}
        onKeyHandle={store.nextResponseIndex}
      />
      <NRKeyHandler
        keyValue={'Enter'}
        onKeyHandle={triggerResponse}
      />
      <NRKeyHandler
        keyValue="Escape"
        onKeyHandle={store.toggleControlsVisible}
      />
      <Modal 
        isOpen={store.controlsVisible}
        contentLabel="Reading controls"
        style={customStyles}
      >
        <div className="controls">
          <h1>Reading controls</h1>
          <label>Reading:&nbsp; 
            <ReadingSelector
              value={store.reading}
              max={store.nreadings}
              set={store.setReading}
            />
          </label>
          <Layout store={store} />
          <label>Size:&nbsp;
            <input
              type="range"
              min="0"
              max="100"
              value={store.responseSize}
              onChange={e => store.setResponseSize(+e.target.value)}
            />
          </label>
          <label>Page Navigation:&nbsp;
            <input
              type="checkbox"
              checked={store.pageTurnVisible}
              onChange={store.togglePageTurnVisible}
            />
          </label>

          <button onClick={store.toggleControlsVisible}>
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
});

const Reader = observer(function Reader(props: {store: Store}) {
  const { store } = props;
  const book = store.book;
  let comment = '';
  const { comments, responses } = book.readings[store.reading];
  if (store.pageno <= store.npages) {
    comment = comments[store.pageno];
  }
  const commentHeight = 30;
  const containerHeight = store.screen.height - commentHeight;
  const sc = store.screen;
  const rs = Math.hypot(sc.width, sc.height) * (0.04 + 0.1 * store.responseSize / 100);
  var cbox: Box = {
    width: sc.width,
    height: containerHeight,
    left: 0,
    top: 0,
    align: 'v'
  };

  var rboxes: Array<Box> = []; // boxes for responses
  if (store.layout.left) {
    cbox.width -= rs;
    cbox.left = rs;
    rboxes.push({ top: 0, left: 0, height: cbox.height, width: rs, align: 'v' });
  }
  if (store.layout.right) {
    cbox.width -= rs;
    rboxes.push({ top: 0, left: sc.width - rs, height: cbox.height, width: rs, align: 'v'});
  }
  if (store.layout.top) {
    cbox.height -= rs;
    cbox.top = rs;
    rboxes.push({ top: 0, left: cbox.left, height: rs, width: cbox.width, align: 'h'});
  }
  if (store.layout.bottom) {
    cbox.height -= rs;
    rboxes.push({ top: containerHeight - rs, left: cbox.left, height: rs, width: cbox.width,
                  align: 'h'});
  }

  const containerStyle = {
    width: store.screen.width,
    height: store.screen.height - 30,
    position: absolute,
    left: 0,
    top: commentHeight
  };

  function sayWord(word: string) {
    var msg = new SpeechSynthesisUtterance(word);
    msg.lang = 'en-US';
    speechSynthesis.speak(msg);
  }

  return (
    <div>
      <div className="comment" >{comment}</div>
      <div style={containerStyle}>
        <ReaderContent box={cbox} book={book} pageno={store.pageno} store={store} />
        <Words boxes={rboxes} responses={responses} store={store} doResponse={sayWord} />
        <Controls store={store} />
      </div>
    </div>
  );
});

export default Reader;
