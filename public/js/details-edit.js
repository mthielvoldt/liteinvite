
const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const guestPostRoute = "/events/" + meetId + "/guests-save";
const guestListRoute = "/events/" + meetId + "/guests-full";
const detailsGetRoute = "/events/" + meetId + "/details";
console.log("From details-edit: meetId=" + meetId);

const rootElement = document.getElementById("details-edit");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement 
);


function App() {
    const [details, setDetails] = useState({name:"", desc:""});

    const xhr = new XMLHttpRequest();
    xhr.onload = () => {setDetails(JSON.parse(xhr.response))};

    useEffect(() => {
        xhr.open("get", detailsGetRoute);
        xhr.send();
    }, []);

    function handleChange(event) {
        const {name, value} = event.target;
        let newDetails = {...details, [name]: value}
        
        setDetails( newDetails );
        console.log(newDetails);

    }

    return (
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
