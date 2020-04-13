
const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const detailsRoute = "/events/" + meetId + "/details";
const imageRoute = "/events/" + meetId + "/image";
console.log("From details-edit: meetId=" + meetId);

const xhr_load = new XMLHttpRequest();
const xhr_save = new XMLHttpRequest();

let timer;

const rootElement = document.getElementById("details-edit");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

function App() {
    const [details, setDetails] = useState({ name: "", desc: "" });
    const [saved, setSaved] = useState(false);

    xhr_load.onload = () => {
        setDetails(JSON.parse(xhr_load.response));
        adjustTextareaHeight();
    };
    xhr_save.onload = () => {
        if (xhr_save.status === 200) setSaved(true);
    };


    useEffect(() => {
        xhr_load.open("get", detailsRoute);
        xhr_load.send();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;
        const newDetails = { ...details, [name]: value };
        setDetails(newDetails);

        // Send changes to server after 2 seconds of inactivity. 
        clearTimeout(timer);
        setSaved(false);
        timer = setTimeout(putDetails, 1000);

        function putDetails() {
            console.log(newDetails);
            xhr_save.open("PUT", detailsRoute);
            xhr_save.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr_save.send(JSON.stringify(newDetails));
        }
    }

    return (
        <div>
            <form className="App">
                <Detail
                    name="name"
                    label="Event Name"
                    content={details.name}
                    change={handleChange}
                />
                <Description
                    name="desc"
                    label="Description"
                    content={details.desc}
                    change={handleChange}
                />
            </form>

            <ImageSelect />
            <h5 hidden={!saved}>Changes Saved</h5>
        </div>

    );
}

function Detail(props) {
    return (
        <div>
            <h5 className="text-shadow">{props.label}</h5>
            <input
                name={props.name}
                type="text"
                onChange={props.change}
                value={props.content}
                className="event-detail event-detail-single" />
        </div>
    );
}

function Description(props) {
    return (
        <div>
            <h5 className="text-shadow">{props.label}</h5>
            <textarea
                id="description"
                name={props.name}
                value={props.content}
                onChange={props.change}
                rows="7"
                className="event-detail event-detail-single" />
        </div>
    );
}

function ImageSelect() {

    return (
        <form id="upload-form" action={imageRoute} method="post" encType="multipart/form-data">
            <div className="input-group mb-3">
                <div className="custom-file">
                    <input
                        type="file"
                        name="meetupImage"
                        id="meetupImageInput"
                        className="event-item custom-file-input"
                        accept="image/*" />
                    <label htmlFor="meetupImageInput" className="custom-file-label">Upload an Image</label>
                </div>
                <div className="input-group-append">
                    <button id="imageUploadBtn" className="btn btn-primary" type="submit" disabled>Upload</button>
                </div>
            </div>
        </form>
    );
}

document.querySelector('.custom-file-input').addEventListener('change', function (e) {
    var fileName = document.getElementById("meetupImageInput").files[0].name;
    var nextSibling = e.target.nextElementSibling
    nextSibling.innerText = fileName;
    var uploadBtn = document.getElementById("imageUploadBtn");
    uploadBtn.removeAttribute("disabled");
});

// the event description can get to be bigger than the default textarea size. 
// Here, we size up the rectangle if necessary, so we can see it all. 
function adjustTextareaHeight() {
    let description = document.getElementById("description");
    description.style.height = description.scrollHeight + 2 + "px";
}