const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const guestEmail = document.getElementById("guest-email").innerText;
const commentsRoute = "/events/" + meetId + "/comments";

const xhr = new XMLHttpRequest();

ReactDOM.render(
    <React.StrictMode>
        <h2 className="event-h mb-3">Comments</h2>
        <AddComment />
        <Comments />
    </React.StrictMode>,
    document.getElementById("comments")
);

function Comments() {
    const [comments, setComments] = useState([]);

    xhr.onload = function () {
        let res = JSON.parse(this.response);
        res.reverse();
        console.log(res);
        setComments(res);
    };

    useEffect(() => {
        xhr.open("get", commentsRoute + "?email=" + guestEmail);
        xhr.send();
    }, []);

    if (comments.length === 0) return null;

    return (
        <div className="event-view-box event-view-box-single desc-view mt-3">
            {comments.map((comment) => (
                <Comment
                    key={comment.id}
                    comment={comment}
                />
            ))}
        </div>
    );
}

function Comment({ comment }) {

    function deleteComment() {
        xhr.open("delete", commentsRoute + "/" + comment.id + "?email=" + guestEmail);
        xhr.send();
    }

    return (
        <div>
            <div className="d-flex justify-content-between">
                <em>{comment.name} ~ {comment.date} </em>
                {comment.mine &&
                    <button className="btn btn-sm btn-outline-secondary" onClick={deleteComment}>
                        <svg className="bi bi-x-circle" width="1.2em" height="1.2em" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path fillRule="evenodd" d="M11.854 4.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708-.708l7-7a.5.5 0 0 1 .708 0z" />
                            <path fillRule="evenodd" d="M4.146 4.146a.5.5 0 0 0 0 .708l7 7a.5.5 0 0 0 .708-.708l-7-7a.5.5 0 0 0-.708 0z" />
                        </svg>
                    </button>
                }
            </div>

            <p className="ml-3"> {comment.text}</p>
            <hr />
        </div>
    );
}

function AddComment(props) {
    const [comment, setComment] = useState("");
    const [visible, setVisible] = useState(false);
    const [alert, setAlert] = useState("");

    function handleChange(event) {
        setComment(event.target.value);

    }
    function postComment() {
        setVisible(false);
        if (comment === "") return;
        const newComment = {
            name: document.getElementById("guest-name").innerText,
            email: guestEmail,
            text: comment
        }
        xhr.open("POST", commentsRoute + "?email=" + guestEmail);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify(newComment));
        setComment("");
    }

    function handleExpand() {
        if (document.getElementById("guest-name").innerText == "") {
            setAlert("Please RSVP with a name first")
        } else {
            setVisible(true);
        }
    }

    let expanded = (
        <form className="App">
            <textarea
                id="new-comment"
                value={comment}
                onChange={handleChange}
                rows="2"
                className="event-edit-box event-edit-box-single"
                placeholder="Use comments to organize or share." />
            <button type="button" className="btn btn-primary" onClick={postComment}>Add Comment</button>
        </form>
    );

    let collapsed = (
        <div>
            <button
                className="btn btn-sm btn-secondary"
                onClick={handleExpand}>
                Add Comment
        </button>
            {alert && <div className="alert alert-warning" role="alert">{alert}</div>}
        </div>
    )

    return (
        <div>
            {visible ? expanded : collapsed}
        </div>
    );
}
