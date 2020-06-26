const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const guestEmail = document.getElementById("guest-email").innerText;
const guestName = document.getElementById("guest-name").innerText;
const commentsRoute = "/events/" + meetId + "/comments";

const xhr_save = new XMLHttpRequest();
const xhr_load = new XMLHttpRequest();

ReactDOM.render(
    <React.StrictMode>
        <AddComment />
        <Comments />
    </React.StrictMode>,
    document.getElementById("comments")
);

function Comments() {
    const [comments, setComments] = useState([]);

    xhr_load.onload = xhr_save.onload = function () {
        let res = JSON.parse(this.response);
        res.reverse();
        console.log(res);
        setComments(res);
    };

    useEffect(() => {
        xhr_load.open("get", commentsRoute);
        xhr_load.send();
    }, []);



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
    return (
        <div>
            <em>{comment.name} ~ {comment.date} </em>
            <p className="ml-3"> {comment.text}</p>
            <hr/>
        </div>
    );
}

function AddComment(props) {
    const [comment, setComment] = useState("");

    function handleChange(event) {
        setComment(event.target.value);

    }
    function postComment() {
        const newComment = {
            name: guestName,
            text: comment
        }
        xhr_save.open("POST", commentsRoute);
        xhr_save.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr_save.send(JSON.stringify(newComment));
        setComment("");
    }
    return (
        <div>
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
        </div>

    );
}
