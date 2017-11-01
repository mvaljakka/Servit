drop table if exists Code;

-- create independent entities first

create table Code(
	id         int not null primary key auto_increment,
	class      varchar(30),
	code       varchar(30),
	lang       varchar(2),
	label      varchar(2000)
) engine=InnoDB default charset utf8 collate utf8_swedish_ci;



create table Profile(
    id          int not null primary key auto_increment,
    profile_eth varchar(64),    -- profile contract's Eth address
    profile_hash varchar(64),
    eth         varchar(64),    -- profile owner's initial Eth address
    firstname   varchar(30),
    lastname    varchar(50),
    email       varchar(60),
    company     varchar(60),
    tel         varchar(30),
    passhash    varchar(64),
    description text
)  engine=InnoDB default charset utf8 collate utf8_swedish_ci;




create table Service(
    id         int not null primary key auto_increment,
    type   varchar(30),  -- code
    role       varchar(10),  -- "available" or "request"
    area       varchar(60),
    title      varchar(255),
    description text,
    keywords   varchar(255),
    profile_id    int  -- foreign key references Profile.id
)  engine=InnoDB default charset utf8 collate utf8_swedish_ci;

create table Log(
    id          int not null primary key auto_increment,
    dt          timestamp DEFAULT CURRENT_TIMESTAMP,
    profile_id  int, -- references Profile.id
    txid        varchar(64),   -- transaction id (? why)
    txhash      varchar(64),   -- transaction hash
    txblock     int,           -- block affected
    txaddr      varchar(64),   -- primary address (initiator)
    txaddr2     varchar(64),   -- secondary or target address, if any
    txamount    long,          -- amount transferred, if any (in Wei, if Eth)
    txunit      varchar(20),   -- unit: Eth, Servit tokens, other, if any
    txgas       long,          -- gas consumed
    txmsg       varchar(200),
    txinfo      text,          -- free description
    status      varchar(20) default ''
)  engine=InnoDB default charset utf8 collate utf8_swedish_ci;
    
    
    
Profile
    id  primary
    name
    email
    passhash
    other contact info
    other auth info
    (address_eth  string)
    
    
Agreement
   id primary
   seller_id  ref -> Profile
   buyer_id  ref->Profile
   service     ref->Code
   address_eth  string
   date          date
   date_start  date
   date_end   date
   contents & terms..
   
   
Delivery
   id primary
   agr_id  ref→Agreement
   address_eth     string
   date    date
   date_delivery  date
   date_expires    date
   deposit             number
   total                 number
   contents & terms..

