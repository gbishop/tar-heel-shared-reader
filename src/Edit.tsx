import * as React from 'react';
import { observer } from 'mobx-react';
import { IPromiseBasedObservable } from 'mobx-utils';
import Store from './Store';
import { observable, action, computed } from 'mobx';
import { THRURL, SharedBook, SharedBookList, CreateResponse, LevelNames } from './db';
import { WaitToRender } from './helpers';
import './Edit.css';

interface SingleCommentEditorProps {
  comments: string[][];
  pageno: number;
  reading: number;
}

@observer
class SingleCommentEditor extends React.Component<SingleCommentEditorProps, {}> {
  @action.bound updateComment(e:React.ChangeEvent<HTMLInputElement>) {
    const {comments, pageno, reading} = this.props;
    comments[reading][pageno] = e.target.value;
    // if they add to the last reading, create another one
    // we'll delete fully empty readings on save
    if (reading === comments.length - 1) {
      this.addReading();
    }
  }
  @action.bound addReading() {
    const comments = this.props.comments;
    comments.push(new Array(comments[0].length).fill(''));
  }
  render() {
    const {comments, pageno, reading} = this.props;
    const npages = comments[0].length;
    return (
      <input
        type="text"
        value={comments[reading][pageno]}
        onChange={this.updateComment}
        tabIndex={reading*npages+pageno+1}
      />
    );
  }
}

interface CommentEditorProps {
  book: SharedBook;
}

@observer
class CommentEditor extends React.Component<CommentEditorProps, {}> {
  @observable comments: string[][];
  @observable level: string;
  @action.bound setLevel(s: string) {
    this.level = s;
  }
  constructor(props: any) {
    super(props);
    this.comments = this.props.book.comments;
    this.level = this.props.book.level;
  }
  @action.bound save(status: string) {
    console.log('save', status);
  }
  render() {
    const book = this.props.book;
    const nreadings = this.comments.length;
    return (
      <div>
        <table className="editor">
          <thead>
            <tr>
              <th>Page</th>
              <th>Content</th>
              <th>Reading:&nbsp;Comment</th>
            </tr>
          </thead>
          <tbody>
            {
            book.pages.map((page, pn) =>
            this.comments.map((comment, rn) =>
            <tr key={`${pn}:${rn}`}>
              {rn===0 && <td rowSpan={nreadings}>{pn+1}</td>}
              {rn===0 && <td rowSpan={nreadings}>
                <figure>
                  <img src={THRURL + page.url} />
                  <figcaption>{page.text}</figcaption>
                </figure>
              </td>}
              <td>{rn+1}:&nbsp;
                <SingleCommentEditor
                  comments={this.comments}
                  pageno={pn}
                  reading={rn}
                />
              </td>
            </tr>
          ))
          }
        </tbody>
        </table>
        <p>
          <label>Set the level:&nbsp;
            <select value={this.level} onChange={(e)=>this.setLevel(e.target.value)}>
              <option value="">Choose a level</option>
              {LevelNames.map(name =>
              <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        </p>
        <button onClick={(e)=>this.save('draft')}>Save as draft</button>
        <button onClick={(e)=>this.save('published')}>Publish</button>
      </div>
    );
  }
}

@observer
class Edit extends React.Component<{store: Store}, {}> {
  @observable newSlug = '';
  @action.bound setNewSlug(s: string) {
    this.newSlug = s;
  }
  @observable message = '';
  @action.bound setMessage(s: string) {
    this.message = s;
  }
  @action.bound createBook() {
    const store = this.props.store;
    store.db.createNewBook(this.newSlug).then(
      (v) => store.setEditPath(v.slug),
      (e) => this.setMessage(e.message));
  }
  @computed get bookP() {
    const store = this.props.store;
    return store.db.fetchBook(store.editSlug);
  }
  render() {
    const store = this.props.store;
    if (store.editSlug.length === 0) {
      return (
        <div>
          <input
            type="text"
            value={this.newSlug}
            onChange={(e) => this.setNewSlug(e.target.value)}
            placeholder="Enter a THR slug"
          />
          <button
            onClick={this.createBook}
          >Create</button>
          <p>{this.message}</p>
        </div>
      );
    } else {
      return WaitToRender(this.bookP,
        (book) => <CommentEditor book={book}/>);
    }
  }
}

export default Edit;
