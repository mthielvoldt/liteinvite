
const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const detailsRoute = "/events/" + meetId + "/details";
console.log("From details-edit: meetId=" + meetId);

const xhr_load = new XMLHttpRequest();
const xhr_save = new XMLHttpRequest();


const rootElement = document.getElementById("details-edit");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

let timer;

function App() {
    const [details, setDetails] = useState({ name: "", desc: "" });
    const [saved, setSaved] = useState(false);

    xhr_load.onload = () => { setDetails(JSON.parse(xhr_load.response)); };
    xhr_save.onload = () => { 
        if (xhr_save.status === 200) setSaved(true); };
    

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
                <Detail
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

    function changeDetail(event) {
        console.log("hey");
        props.change(event);
        //setDetails( Object.assign( details, {[detail]:newContent} ));
        //setDetails( { ...details, [detail]: newContent } );
    }
    return (
        <div>
            <h5>{props.label}</h5>
            <input
                name={props.name}
                type="text"
                onChange={props.change}
                value={props.content}
                className="event-item list-group-item" />
            {/* <p contentEditable="true" onChange={changeDetail} >{props.content}</p> */}
        </div>
    );
}

function ImageSelect() {

    return (
        <form id="upload-form" action="/events/<%=meetup._id%>/image" method="post" encType="multipart/form-data">
            <div className="input-group mb-3">
                <div className="custom-file">
                    <input type="file" name="meetupImage" id="meetupImageInput" className="event-item custom-file-input" accept="image/*" />
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