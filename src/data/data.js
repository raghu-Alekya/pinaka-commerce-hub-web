export const merchants = [
 {id:"MER-0001", initials:"DS", name:"Downtown Solutions", email:"contact@downtown.com", phone:"+1 (512) 555-0101", stores:5, plan:"Enterprise", renewal:"May 12, 2025", status:"Active", joined:"Jan 12, 2024", active:"2 mins ago"},
 {id:"MER-0002", initials:"WM", name:"Westside Market LLC", email:"hello@westside.com", phone:"+1 (512) 555-0102", stores:3, plan:"Professional", renewal:"Jun 18, 2025", status:"Active", joined:"Feb 5, 2024", active:"10 mins ago"},
 {id:"MER-0003", initials:"SM", name:"Sunshine Mart", email:"info@sunshinemart.com", phone:"+91 98765 11111", stores:2, plan:"Professional", renewal:"Apr 2, 2025", status:"Active", joined:"Mar 3, 2024", active:"1 hour ago"},
 {id:"MER-0004", initials:"AE", name:"Airport Express", email:"admin@airportexpress.com", phone:"+1 (972) 555-0177", stores:4, plan:"Enterprise", renewal:"May 5, 2025", status:"Suspended", joined:"Apr 10, 2024", active:"1 day ago"},
 {id:"MER-0005", initials:"LR", name:"Lakeside Retail", email:"support@lakeside.com", phone:"+1 (469) 555-0144", stores:1, plan:"Starter", renewal:"Jan 20, 2025", status:"Active", joined:"Apr 14, 2024", active:"2 hours ago"},
 {id:"MER-0006", initials:"CF", name:"City Fresh Foods", email:"contact@cityfresh.com", phone:"+1 (214) 555-0118", stores:6, plan:"Enterprise", renewal:"Jul 1, 2025", status:"Inactive", joined:"May 1, 2024", active:"15 days ago"},
 {id:"MER-0007", initials:"BR", name:"Bright Retailers", email:"info@brightretail.com", phone:"+1 (281) 555-0155", stores:2, plan:"Professional", renewal:"Apr 30, 2025", status:"Active", joined:"May 9, 2024", active:"30 mins ago"},
 {id:"MER-0008", initials:"GV", name:"Green Valley Stores", email:"hello@greenvalley.com", phone:"+1 (830) 555-0122", stores:3, plan:"Starter", renewal:"Mar 15, 2025", status:"Suspended", joined:"Jun 2, 2024", active:"3 days ago"},
]
export const stores = [
 {id:"ST-00123", initials:"DS", name:"Downtown Store", merchant:"ABC Retail", location:"Dallas, TX", devices:12,status:"Active",sync:"2 mins ago",type:"Retail Store"},
 {id:"ST-00124", initials:"WM", name:"Westside Market", merchant:"XYZ Foods", location:"Austin, TX", devices:8,status:"Active",sync:"5 mins ago",type:"Retail Store"},
 {id:"ST-00125", initials:"SM", name:"Sunshine Mart", merchant:"Sunshine LLC", location:"Houston, TX", devices:6,status:"Offline",sync:"15 mins ago",type:"Retail Store"},
 {id:"ST-00126", initials:"AE", name:"Airport Express", merchant:"ABC Retail", location:"Dallas, TX", devices:4,status:"Active",sync:"8 mins ago",type:"Retail Store"},
 {id:"ST-00127", initials:"LS", name:"Lakeside Store", merchant:"Retail Corp", location:"Plano, TX", devices:5,status:"Syncing",sync:"Syncing now",type:"Retail Store"},
 {id:"ST-00128", initials:"GM", name:"Green Market", merchant:"XYZ Foods", location:"Austin, TX", devices:3,status:"Maintenance",sync:"Yesterday",type:"Retail Store"},
 {id:"STR-0004", initials:"WM", name:"Westside Market", merchant:"Westside Market LLC", location:"Hyderabad, Telangana", devices:8,status:"Active",sync:"5 mins ago",type:"Retail Store"},
 {id:"STR-0005", initials:"WM", name:"Westside Market North", merchant:"Westside Market LLC", location:"Hyderabad, Telangana", devices:5,status:"Active",sync:"8 mins ago",type:"Retail Store"},
]
export const usersSeed = [
 {id:"USR-0001",storeId:"STR-0004",storeName:"Westside Market",username:"james.wilson",firstName:"James",lastName:"Wilson",role:"Admin",email:"james.wilson@westside.com",phone:"+91 98765 43210",cashboxAccess:true,status:"Active"},
 {id:"USR-0002",storeId:"STR-0004",storeName:"Westside Market",username:"sarah.johnson",firstName:"Sarah",lastName:"Johnson",role:"Manager",email:"sarah.johnson@westside.com",phone:"+91 98765 43211",cashboxAccess:true,status:"Active"},
 {id:"USR-0003",storeId:"STR-0004",storeName:"Westside Market",username:"mike.brown",firstName:"Mike",lastName:"Brown",role:"Cashier",email:"mike.brown@westside.com",phone:"+91 98765 43212",cashboxAccess:true,status:"Active"},
 {id:"USR-0004",storeId:"STR-0005",storeName:"Westside Market North",username:"emma.davis",firstName:"Emma",lastName:"Davis",role:"Shop manager",email:"emma.davis@westside.com",phone:"+91 98765 43213",cashboxAccess:true,status:"Active"},
 {id:"USR-0005",storeId:"STR-0005",storeName:"Westside Market North",username:"alex.miller",firstName:"Alex",lastName:"Miller",role:"Cashier",email:"alex.miller@westside.com",phone:"+91 98765 43214",cashboxAccess:false,status:"Active"},
]
export const orders = [
 {id:"#ORD-1048",store:"Downtown Store",customer:"Olivia Smith",amount:"$248.00",status:"Completed",time:"2 mins ago"},
 {id:"#ORD-1047",store:"Westside Market",customer:"Daniel Brown",amount:"$128.50",status:"Processing",time:"8 mins ago"},
 {id:"#ORD-1046",store:"Sunshine Mart",customer:"Emma Davis",amount:"$86.20",status:"Completed",time:"12 mins ago"},
 {id:"#ORD-1045",store:"Airport Express",customer:"Noah Wilson",amount:"$315.00",status:"Pending",time:"19 mins ago"},
]
export const merchantStores = {
 "MER-0001":[
  {id:"STR-0001",name:"Downtown Main Store",type:"Retail Store",location:"Dallas, TX",status:"Active",devices:12},
  {id:"STR-0002",name:"Downtown North Store",type:"Retail Store",location:"Dallas, TX",status:"Active",devices:8},
  {id:"STR-0003",name:"Downtown Airport Store",type:"Retail Store",location:"Dallas, TX",status:"Active",devices:6},
 ],
 "MER-0002":[
  {id:"STR-0004",name:"Westside Market",type:"Retail Store",location:"Hyderabad, Telangana",status:"Active",devices:8},
  {id:"STR-0005",name:"Westside Market North",type:"Retail Store",location:"Hyderabad, Telangana",status:"Active",devices:5},
 ]
}
