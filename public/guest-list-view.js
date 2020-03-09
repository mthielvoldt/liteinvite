//import React, { useState, useEffect } from "react";

const useState = React.useState;
const useEffect = React.useEffect;

const thisScript = $("#guest-list-script");
const meetId = thisScript.attr("meetup-id");
const guestPostRoute = "/guest/" + meetId;
const guestListRoute = "/guestlist/" + meetId + ".json";
console.log("meetId: " + meetId);

const rootElement = document.getElementById("guest-list");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

function App() {
    const [guests, setGuests] = useState([]);

    // run only once at page-load to populate the guest-list
    useEffect(() => {
        fetch(guestListRoute)
            .then(res => res.json())
            .then((fetchedGuests) => {
                setGuests(fetchedGuests);
            })
            .catch(error => console.log(error));
    }, []);

    function addGuest(newGuest) {
        console.log(newGuest);

        // Check to see if this email has been entered before (case-insensitive match)
        const hasMatch = guests.some((guest) => guest.email.toUpperCase() === newGuest.email.toUpperCase());

        if (hasMatch) {
            console.log("email matches one previously entered.");
        } else {
            setGuests([...guests, newGuest ]);
        }
    }

    return (
        <div className="App ">
            <GuestHeader numGuests={guests.length} />
            <GuestList guests={guests} />
            <RSVP addGuest={addGuest} />
        </div>
    );
}

function GuestHeader(props) {
    return (
        <h3 className="d-flex justify-content-between align-items-center mb-3">
            <span>Who's Coming:</span>
            <span className="badge badge-secondary badge-pill">{props.numGuests}</span>
        </h3>
    );
}
function GuestList(props) {
    return (
        <ul className="list-group mb-3">
            {props.guests.map((guest, index) => (
                props.guests.status && <GuestLine guest={guest} key={index} />
            ))}
        </ul>
    );
}
function GuestLine(props) {
    return (
        <li className="list-group-item d-flex justify-content-between lh-condensed">
            <div>
                <strong className="my-0">{props.guest.email}</strong>
            </div>
            <strong className="text-success">
                \u2714
            </strong>
        </li>
    );
}

function ajaxSuccess() {
    console.log(this.responseText);
}
var oReq = new XMLHttpRequest();
oReq.onload = ajaxSuccess;


function RSVP(props) {
    const [coming, setComing] = useState(false);

    return (
        coming ?
            (<div><GuestAdd addGuest={props.addGuest} />
                <button className="btn btn-secondary" onClick={() => { setComing(false) }} > Cancel </button>
            </div>) :
            (<button className="btn btn-primary" onClick={() => { setComing(true); }}> RSVP </button>)
    );
}

function GuestAdd(props) {

    const [guest, setGuest] = useState({ name: "", email: "", status: 0 });

    function SubmitGuest( guestStatus ) {

        // Here, we pass this email string to the parent component.
        guest.status = guestStatus; // I think this will be okay becaue I setGuest() below.
        props.addGuest(guest);

        let oFormElement = event.target;
        let formData = new FormData(oFormElement);
        for (let value of formData.values()) {
            console.log(value);
        }
        oReq.open("post", guestPostRoute);
        oReq.send(formData);
        setGuest({name:"", email:"", status:0});       // clear the input box. 
        event.preventDefault();
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setGuest({ ...guest, [name]: value });
    }



    return (
        <form className="card p-2 mb-2" >
            <div className="input-group">

                {(guest.email === "") ?
                    (<input className="" name="email" onChange={handleChange} value={guest.email} placeholder="Enter your email" />) :
                    (<div>
                        <h3> mikeThielvoldt@gmail.com</h3>
                        <button className="btn btn-secondary" onClick={() => { setComing(false) }} > That't not me </button>
                    </div>)}

                <input className="" name="name" onChange={handleChange} value={guest.name} placeholder="Enter a nickname" />
                <button className="btn btn-primary mb-2" onClick={() => {SubmitGuest(1);}} name="status" value="1">I'm coming!</button>
                <button className="btn btn-secondary" onClick={() => {SubmitGuest(-1);}} name="status" value="-1">Can't make it</button>
            </div>
        </form>
    )
}



