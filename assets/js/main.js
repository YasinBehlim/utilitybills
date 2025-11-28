document.addEventListener("DOMContentLoaded", function() {
    console.log("Utility Portal Loaded");

    // Firebase must be initialized first
    if (typeof db === "undefined") {
        alert("Firebase not initialized! Check your config.");
        return;
    }

    /* --------------------------
       GENERATE / FETCH BILL
    -------------------------- */
    const billForm = document.getElementById("fetchBillForm");
    if (billForm) {
        billForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const consumer = document.getElementById("consumerNumber").value.trim();
            const month = document.getElementById("billMonth").value;
            const utility = document.getElementById("utilityType").value;
            const province = document.getElementById("province").value;
            const provider = document.getElementById("provider").value;

            if (!consumer || !month || !utility || !province || !provider) {
                alert("Please fill all fields.");
                return;
            }

            try {
                const querySnapshot = await db.collection("bills")
                    .where("consumer", "==", consumer)
                    .where("month", "==", month)
                    .where("utility", "==", utility)
                    .where("province", "==", province)
                    .where("provider", "==", provider)
                    .limit(1)
                    .get();

                const billDiv = document.getElementById("billResult");

                if (querySnapshot.empty) {
                    billDiv.innerHTML = "<p>No bill found for this consumer number/month.</p>";
                    return;
                }

                const doc = querySnapshot.docs[0].data();
                const units = doc.units || 0;
                const tariff = doc.tariff || 0;
                const amount = units * tariff;
                const lateFee = parseFloat((amount * 0.1).toFixed(2));
                const totalPayable = parseFloat((amount + lateFee).toFixed(2));

                billDiv.innerHTML = `
                    <div class="bill-card">
                        <h3>${utility.charAt(0).toUpperCase() + utility.slice(1)} Bill</h3>
                        <p><strong>Consumer No:</strong> ${consumer}</p>
                        <p><strong>Month:</strong> ${month}</p>
                        <p><strong>Units:</strong> ${units}</p>
                        <p><strong>Tariff/unit:</strong> Rs ${tariff}</p>
                        <p><strong>Amount:</strong> Rs ${amount.toFixed(2)}</p>
                        <p><strong>Late Fee (10%):</strong> Rs ${lateFee.toFixed(2)}</p>
                        <p><strong>Total Payable:</strong> Rs ${totalPayable.toFixed(2)}</p>
                        <p><strong>Due Date:</strong> ${doc.dueDate || "N/A"}</p>
                        <button id="downloadPdf">Download PDF</button>
                    </div>
                `;

                document.getElementById("downloadPdf").addEventListener("click", function() {
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF();
                    pdf.text(billDiv.innerText, 10, 10);
                    pdf.save(`Bill_${consumer}_${month}.pdf`);
                });

            } catch (error) {
                console.error("Error fetching bill:", error);
                alert("Error fetching bill data. Check console for details.");
            }
        });
    }

    /* --------------------------
       LOAD SHEDDING SEARCH
    -------------------------- */
    const lsForm = document.getElementById("loadSheddingForm");
    if (lsForm) {
        document.getElementById("checkLS").addEventListener("click", function() {
            const area = document.getElementById("lsArea").value.trim();
            const utility = document.getElementById("lsUtility").value;
            const province = document.getElementById("lsProvince").value;
            const provider = document.getElementById("lsProvider").value;

            if (!area || !utility || !province || !provider) {
                alert("Please fill all fields.");
                return;
            }

            // Example: fetch load shedding info from Firebase
            db.collection("loadShedding")
                .where("area", "==", area)
                .where("utility", "==", utility)
                .where("province", "==", province)
                .where("provider", "==", provider)
                .limit(1)
                .get()
                .then(snapshot => {
                    const lsDiv = document.getElementById("lsResult");
                    if (snapshot.empty) {
                        lsDiv.innerHTML = "<p>No load shedding info found for this area.</p>";
                        return;
                    }
                    const doc = snapshot.docs[0].data();
                    lsDiv.innerHTML = `
                        <div class="bill-card">
                            <h3>Load Shedding Info</h3>
                            <p><strong>Area:</strong> ${area}</p>
                            <p><strong>Reason:</strong> ${doc.reason || "N/A"}</p>
                            <p><strong>Start Time:</strong> ${doc.startTime || "N/A"}</p>
                            <p><strong>End Time:</strong> ${doc.endTime || "N/A"}</p>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error("Error fetching load shedding:", error);
                    alert("Error fetching load shedding data.");
                });
        });
    }
});
